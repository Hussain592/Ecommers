-- Keep account and vendor approval fields under admin control.
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending';

UPDATE public.vendors SET status = 'Pending' WHERE status IS NULL;
ALTER TABLE public.vendors ALTER COLUMN status SET DEFAULT 'Pending';
ALTER TABLE public.vendors ALTER COLUMN status SET NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin can change account roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_escalation ON public.users;
CREATE TRIGGER prevent_self_role_escalation
BEFORE UPDATE OF role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

CREATE OR REPLACE FUNCTION public.prevent_vendor_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin can change vendor approval status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_vendor_self_approval ON public.vendors;
CREATE TRIGGER prevent_vendor_self_approval
BEFORE UPDATE OF status ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.prevent_vendor_self_approval();

DROP FUNCTION IF EXISTS public.review_vendor_application(uuid, text);

CREATE FUNCTION public.review_vendor_application(
  p_vendor_id uuid,
  p_action text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_owner uuid;
  next_status text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  IF p_action IS NULL OR p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Unsupported vendor review action';
  END IF;

  next_status := CASE WHEN p_action = 'approve' THEN 'Active' ELSE 'Rejected' END;

  UPDATE public.vendors
  SET status = next_status
  WHERE id = p_vendor_id
  RETURNING owner_id INTO vendor_owner;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor not found';
  END IF;

  UPDATE public.users
  SET role = CASE WHEN p_action = 'approve' THEN 'vendor' ELSE 'customer' END
  WHERE auth_id = vendor_owner;

  RETURN next_status;
END;
$$;

REVOKE ALL ON FUNCTION public.review_vendor_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_vendor_application(uuid, text) TO authenticated;

-- Delivery is one marketplace-level fee per cart; stock is reserved transactionally.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS inventory_restored_at timestamptz;

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS recipient_vendor_id uuid
  REFERENCES public.vendors(id) ON DELETE SET NULL;

UPDATE public.payouts AS p
SET recipient_vendor_id = v.id
FROM (
  SELECT name, min(id::text)::uuid AS id
  FROM public.vendors
  GROUP BY name
  HAVING count(*) = 1
) AS v
WHERE p.recipient_vendor_id IS NULL
  AND p.recipient_type = 'Vendor'
  AND p.recipient_name = v.name;

DROP POLICY IF EXISTS "Vendors read own payouts" ON public.payouts;
CREATE POLICY "Vendors read own payouts"
ON public.payouts FOR SELECT TO authenticated
USING (
  recipient_vendor_id IN (
    SELECT id FROM public.vendors WHERE owner_id = auth.uid()
  )
);
GRANT SELECT ON public.payouts TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_order_updates_and_restore_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line jsonb;
  commission_rate numeric := 8;
BEGIN
  IF NOT public.is_admin() THEN
    IF auth.uid() IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.vendors
        WHERE id = OLD.vendor_id AND owner_id = auth.uid()
      )
      OR (to_jsonb(NEW) - 'status')
        IS DISTINCT FROM
         (to_jsonb(OLD) - 'status')
    THEN
      RAISE EXCEPTION 'Vendors may only update the status of their own orders';
    END IF;
  END IF;

  IF OLD.status = 'Cancelled' AND NEW.status <> 'Cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be reopened';
  END IF;

  IF NOT public.is_admin() AND NOT (
    (OLD.status = 'Pending' AND NEW.status IN ('Confirmed', 'Cancelled'))
    OR (OLD.status = 'Confirmed' AND NEW.status IN ('Dispatched', 'Cancelled'))
    OR (OLD.status = 'Dispatched' AND NEW.status = 'Delivered')
    OR OLD.status = NEW.status
  ) THEN
    RAISE EXCEPTION 'Invalid order status transition';
  END IF;

  IF NEW.status = 'Cancelled'
    AND OLD.status IN ('Dispatched', 'Delivered')
  THEN
    RAISE EXCEPTION 'Dispatched or delivered orders cannot be cancelled here';
  END IF;

  IF NEW.status = 'Cancelled'
    AND OLD.status <> 'Cancelled'
    AND OLD.stock_reserved_at IS NOT NULL
    AND OLD.inventory_restored_at IS NULL
  THEN
    FOR line IN
      SELECT value FROM jsonb_array_elements(COALESCE(OLD.items, '[]'::jsonb))
    LOOP
      IF line ->> 'id' IS NOT NULL
        AND COALESCE(line ->> 'quantity', '') ~ '^[1-9][0-9]*$'
      THEN
        UPDATE public.products
        SET stock = stock + (line ->> 'quantity')::integer
        WHERE id = line ->> 'id';
      END IF;
    END LOOP;
    NEW.inventory_restored_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_order_updates_and_restore_stock ON public.orders;
CREATE TRIGGER guard_order_updates_and_restore_stock
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_updates_and_restore_stock();

CREATE OR REPLACE FUNCTION public.create_vendor_payout_for_delivered_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_name text;
  setting_value text;
  commission_rate numeric := 8;
BEGIN
  IF NEW.status = 'Delivered'
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.vendor_id IS NOT NULL
  THEN
    SELECT name INTO vendor_name
    FROM public.vendors
    WHERE id = NEW.vendor_id;

    SELECT value #>> '{}' INTO setting_value
    FROM public.platform_settings
    WHERE key = 'commission_rate';

    IF setting_value IS NOT NULL
      AND setting_value ~ '^[0-9]+(\.[0-9]+)?$'
    THEN
      IF setting_value::numeric BETWEEN 0 AND 100 THEN
        commission_rate := setting_value::numeric;
      END IF;
    END IF;

    IF vendor_name IS NOT NULL THEN
      INSERT INTO public.payouts (
        id, recipient_name, recipient_type, recipient_vendor_id,
        amount, method, status
      )
      VALUES (
        'PYT-' || NEW.id,
        vendor_name,
        'Vendor',
        NEW.vendor_id,
        GREATEST(
          0,
          (NEW.total - COALESCE(NEW.delivery_fee, 0))
            * (1 - commission_rate / 100)
        ),
        'Bank Transfer',
        'Pending'
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_vendor_payout_for_delivered_order ON public.orders;
CREATE TRIGGER create_vendor_payout_for_delivered_order
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_vendor_payout_for_delivered_order();

DROP POLICY IF EXISTS "Admins read all orders" ON public.orders;
CREATE POLICY "Admins read all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update all orders" ON public.orders;
CREATE POLICY "Admins update all orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, UPDATE ON public.orders TO authenticated;
REVOKE INSERT ON public.orders FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.place_cod_orders(
  p_customer_name text,
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
    OR char_length(trim(COALESCE(p_phone, ''))) NOT BETWEEN 7 AND 32
    OR char_length(trim(COALESCE(p_city, ''))) NOT BETWEEN 2 AND 100
    OR char_length(trim(COALESCE(p_address, ''))) NOT BETWEEN 5 AND 500
    OR char_length(COALESCE(p_alternate_phone, '')) > 32
    OR char_length(COALESCE(p_notes, '')) > 1000
  THEN
    RAISE EXCEPTION 'Please enter valid delivery details';
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
      id, customer_name, phone, city, address, alternate_phone, notes,
      customer_id, vendor_id, total, delivery_fee, stock_reserved_at,
      status, items
    )
    SELECT
      'DKN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
      trim(p_customer_name),
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

REVOKE ALL ON FUNCTION public.place_cod_orders(text, text, text, text, text, text, jsonb)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_cod_orders(text, text, text, text, text, text, jsonb)
TO anon, authenticated;

-- Admins may manage service booking request statuses; other users cannot read them.
DROP POLICY IF EXISTS "Admins update service booking requests"
ON public.booking_requests;
CREATE POLICY "Admins update service booking requests"
ON public.booking_requests FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
GRANT UPDATE (status) ON public.booking_requests TO authenticated;
