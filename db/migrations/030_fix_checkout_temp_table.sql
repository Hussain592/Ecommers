-- HOTFIX for 029: checkout failed with "DELETE requires a WHERE clause".
-- Supabase (pg_safeupdate) blocks DELETE statements without WHERE on API calls,
-- and the checkout function cleared its temporary cart table with one.
-- This replaces only place_cod_orders, using TRUNCATE instead.

-- Checkout with variants. Same rules as 022 (server prices, delivery from
-- settings, one delivery fee per cart, stock locked) plus per-variant stock.
CREATE OR REPLACE FUNCTION public.place_cod_orders(
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
  problem_names text;
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

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_items) = 0
    OR jsonb_array_length(p_items) > 100
  THEN
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
      OR (
        value ? 'variant_id'
        AND jsonb_typeof(value -> 'variant_id') <> 'null'
        AND COALESCE(value ->> 'variant_id', '') !~ '^[0-9a-f-]{36}$'
      )
  ) THEN
    RAISE EXCEPTION 'Cart contains an invalid product or quantity';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _checkout_cart (
    product_id text,
    variant_id uuid,
    quantity integer
  ) ON COMMIT DROP;
  -- TRUNCATE, not DELETE: Supabase blocks DELETE without a WHERE clause on API calls.
  TRUNCATE _checkout_cart;

  INSERT INTO _checkout_cart (product_id, variant_id, quantity)
  SELECT value ->> 'id',
         NULLIF(value ->> 'variant_id', '')::uuid,
         sum((value ->> 'quantity')::integer)
  FROM jsonb_array_elements(p_items) AS entry(value)
  GROUP BY 1, 2;

  -- Lock everything we are about to sell, in a fixed order to avoid deadlocks.
  PERFORM p.id FROM public.products AS p
  JOIN _checkout_cart AS c ON c.product_id = p.id
  ORDER BY p.id FOR UPDATE OF p;

  PERFORM v.id FROM public.product_variants AS v
  JOIN _checkout_cart AS c ON c.variant_id = v.id
  ORDER BY v.id FOR UPDATE OF v;

  -- Name every line that can't be sold, so the customer knows what to fix.
  SELECT string_agg(
           COALESCE(p.name, 'A product')
             || CASE WHEN v.id IS NOT NULL
                  THEN ' (' || concat_ws(', ', v.size, v.color) || ')'
                  ELSE '' END,
           ', ')
  INTO problem_names
  FROM _checkout_cart AS c
  LEFT JOIN public.products AS p ON p.id = c.product_id
  LEFT JOIN public.vendors AS ven ON ven.id = p.vendor_id
  LEFT JOIN public.product_variants AS v ON v.id = c.variant_id AND v.product_id = c.product_id
  WHERE p.id IS NULL
    OR p.active IS DISTINCT FROM true
    OR (p.vendor_id IS NOT NULL AND ven.status IS DISTINCT FROM 'Active')
    OR (
      EXISTS (SELECT 1 FROM public.product_variants AS pv WHERE pv.product_id = p.id)
      AND (c.variant_id IS NULL OR v.id IS NULL OR v.stock < c.quantity)
    )
    OR (
      NOT EXISTS (SELECT 1 FROM public.product_variants AS pv WHERE pv.product_id = p.id)
      AND (c.variant_id IS NOT NULL OR p.stock < c.quantity)
    );

  IF problem_names IS NOT NULL THEN
    RAISE EXCEPTION 'Not enough stock for: %. Please update your cart and try again.', problem_names;
  END IF;

  UPDATE public.product_variants AS v
  SET stock = v.stock - c.quantity
  FROM _checkout_cart AS c
  WHERE v.id = c.variant_id;

  UPDATE public.products AS p
  SET stock = p.stock - c.quantity
  FROM _checkout_cart AS c
  WHERE p.id = c.product_id AND c.variant_id IS NULL;

  SELECT sum(p.price * c.quantity)
  INTO cart_subtotal
  FROM _checkout_cart AS c
  JOIN public.products AS p ON p.id = c.product_id;

  shipping_fee := public.delivery_fee_for_subtotal(cart_subtotal);

  WITH vendor_orders AS (
    SELECT
      p.vendor_id,
      sum(p.price * c.quantity) AS subtotal,
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'image', p.image,
          'price', p.price,
          'quantity', c.quantity,
          'variant_id', c.variant_id,
          'size', v.size,
          'color', v.color
        )
        ORDER BY p.name, v.size, v.color
      ) AS items
    FROM _checkout_cart AS c
    JOIN public.products AS p ON p.id = c.product_id
    LEFT JOIN public.product_variants AS v ON v.id = c.variant_id
    GROUP BY p.vendor_id
  ),
  ranked_vendor_orders AS (
    SELECT
      vendor_orders.*,
      row_number() OVER (ORDER BY subtotal DESC, vendor_id NULLS LAST) AS shipping_rank
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
  SELECT array_agg(id) INTO created_order_ids FROM created_orders;

  RETURN created_order_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.place_cod_orders(
  text, text, text, text, text, text, text, jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cod_orders(
  text, text, text, text, text, text, text, jsonb
) TO anon, authenticated;
