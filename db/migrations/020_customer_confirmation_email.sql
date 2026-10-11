-- Collect customer email addresses for order and service confirmations.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_email text;

ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.booking_requests
DROP CONSTRAINT IF EXISTS booking_requests_email_valid;
ALTER TABLE public.booking_requests
ADD CONSTRAINT booking_requests_email_valid
CHECK (
  email IS NULL OR (
    char_length(email) <= 254
    AND email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
  )
);

DROP POLICY IF EXISTS "Public can submit service booking requests"
ON public.booking_requests;
CREATE POLICY "Public can submit service booking requests"
ON public.booking_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'Pending'
  AND email IS NOT NULL
  AND char_length(email) <= 254
  AND email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
);

GRANT INSERT (
  service_id, service_name, customer_name, email, phone, details
)
ON public.booking_requests TO anon, authenticated;

-- Replace the checkout RPC so server-side prices, delivery and stock remain authoritative.
DROP FUNCTION IF EXISTS public.place_cod_orders(
  text, text, text, text, text, text, jsonb
);

CREATE FUNCTION public.place_cod_orders(
  p_customer_name text,
  p_customer_email text,
  p_phone text,
  p_city text,
  p_alternate_phone text,
  p_address text,
  p_notes text,
  p_items jsonb
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_count integer;
  invalid_count integer;
  cart_subtotal numeric;
  shipping_fee numeric;
  created_order_ids text[];
BEGIN
  IF char_length(trim(COALESCE(p_customer_name, ''))) NOT BETWEEN 2 AND 120
    OR char_length(trim(COALESCE(p_customer_email, ''))) > 254
    OR trim(COALESCE(p_customer_email, '')) !~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)+$'
    OR char_length(trim(COALESCE(p_phone, ''))) NOT BETWEEN 7 AND 32
    OR char_length(trim(COALESCE(p_city, ''))) NOT BETWEEN 2 AND 100
    OR char_length(trim(COALESCE(p_address, ''))) NOT BETWEEN 5 AND 500
    OR char_length(COALESCE(p_alternate_phone, '')) > 32
    OR char_length(COALESCE(p_notes, '')) > 1000
  THEN
    RAISE EXCEPTION 'Please enter valid delivery details and email';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Cart is empty or contains too many items';
  END IF;
  IF jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Cart is empty or contains too many items';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS entry(value)
    WHERE jsonb_typeof(value -> 'id') <> 'string'
      OR char_length(value ->> 'id') NOT BETWEEN 1 AND 160
      OR jsonb_typeof(value -> 'quantity') <> 'number'
      OR COALESCE(value ->> 'quantity', '') !~ '^[1-9][0-9]*$'
      OR (value ->> 'quantity')::numeric > 1000
  ) THEN
    RAISE EXCEPTION 'Cart contains an invalid product or quantity';
  END IF;

  SELECT count(DISTINCT value ->> 'id')
  INTO requested_count
  FROM jsonb_array_elements(p_items) AS entry(value);

  PERFORM p.id
  FROM public.products AS p
  JOIN (
    SELECT value ->> 'id' AS product_id
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY value ->> 'id'
  ) AS requested ON requested.product_id = p.id
  ORDER BY p.id
  FOR UPDATE OF p;

  SELECT count(*)
  INTO invalid_count
  FROM (
    SELECT
      value ->> 'id' AS product_id,
      sum((value ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY value ->> 'id'
  ) AS requested
  LEFT JOIN public.products AS p ON p.id = requested.product_id
  LEFT JOIN public.vendors AS v ON v.id = p.vendor_id
  WHERE p.id IS NULL
    OR p.active IS DISTINCT FROM true
    OR p.stock < requested.quantity
    OR (p.vendor_id IS NOT NULL AND v.status IS DISTINCT FROM 'Active');

  IF invalid_count > 0 OR requested_count = 0 THEN
    RAISE EXCEPTION 'A product is unavailable or does not have enough stock';
  END IF;

  WITH requested AS (
    SELECT
      value ->> 'id' AS product_id,
      sum((value ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY value ->> 'id'
  )
  UPDATE public.products AS p
  SET stock = p.stock - requested.quantity
  FROM requested
  WHERE p.id = requested.product_id;

  WITH requested AS (
    SELECT
      value ->> 'id' AS product_id,
      sum((value ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY value ->> 'id'
  )
  SELECT sum(p.price * requested.quantity)
  INTO cart_subtotal
  FROM requested
  JOIN public.products AS p ON p.id = requested.product_id;

  shipping_fee := CASE WHEN cart_subtotal >= 3000 THEN 0 ELSE 250 END;

  WITH requested AS (
    SELECT
      value ->> 'id' AS product_id,
      sum((value ->> 'quantity')::integer) AS quantity
    FROM jsonb_array_elements(p_items) AS entry(value)
    GROUP BY value ->> 'id'
  ),
  vendor_orders AS (
    SELECT
      p.vendor_id,
      sum(p.price * requested.quantity) AS subtotal,
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'image', p.image,
          'price', p.price,
          'quantity', requested.quantity
        )
        ORDER BY p.name
      ) AS items
    FROM requested
    JOIN public.products AS p ON p.id = requested.product_id
    GROUP BY p.vendor_id
  ),
  ranked_vendor_orders AS (
    SELECT
      vendor_orders.*,
      row_number() OVER (
        ORDER BY subtotal DESC, vendor_id NULLS LAST
      ) AS shipping_rank
    FROM vendor_orders
  ),
  created_orders AS (
    INSERT INTO public.orders (
      id, customer_name, customer_email, phone, city, address,
      alternate_phone, notes, customer_id, vendor_id, total, delivery_fee,
      stock_reserved_at, status, items
    )
    SELECT
      'DKN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      trim(p_customer_name),
      lower(trim(p_customer_email)),
      trim(p_phone),
      trim(p_city),
      trim(p_address),
      nullif(trim(COALESCE(p_alternate_phone, '')), ''),
      nullif(trim(COALESCE(p_notes, '')), ''),
      auth.uid(),
      vendor_id,
      subtotal + CASE WHEN shipping_rank = 1 THEN shipping_fee ELSE 0 END,
      CASE WHEN shipping_rank = 1 THEN shipping_fee ELSE 0 END,
      now(),
      'Pending',
      items
    FROM ranked_vendor_orders
    RETURNING id
  )
  SELECT array_agg(id)
  INTO created_order_ids
  FROM created_orders;

  RETURN created_order_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.place_cod_orders(
  text, text, text, text, text, text, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cod_orders(
  text, text, text, text, text, text, text, jsonb
) TO anon, authenticated;
