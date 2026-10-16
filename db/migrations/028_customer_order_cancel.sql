-- Customers can cancel their own order before it is dispatched.
--
-- * Allowed only while the order is Pending or Confirmed.
-- * Signed-in customers cancel from "My Orders"; guests cancel from
--   "Track Order" with the Order ID and the phone number used at checkout.
-- * A reason is required and stored, so the seller knows why.
-- * Stock goes back automatically (existing order trigger).
--
-- Also adds my_orders(): a signed-in customer sees orders placed with their
-- account AND guest orders placed with their confirmed email.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Same order guard as 019, plus one exception: a cancellation that comes from
-- cancel_order_as_customer() (marked with a transaction-local setting).
CREATE OR REPLACE FUNCTION public.guard_order_updates_and_restore_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line jsonb;
  customer_cancel boolean :=
    COALESCE(current_setting('app.order_cancel_by_customer', true), '') = 'on';
BEGIN
  IF NOT public.is_admin() AND NOT customer_cancel THEN
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

CREATE OR REPLACE FUNCTION public.cancel_order_as_customer(
  p_order_id text,
  p_phone text,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  confirmed_email text;
  target public.orders%ROWTYPE;
BEGIN
  IF char_length(trim(COALESCE(p_reason, ''))) NOT BETWEEN 3 AND 300 THEN
    RAISE EXCEPTION 'Please choose a reason for cancelling';
  END IF;

  IF uid IS NOT NULL THEN
    SELECT lower(email) INTO confirmed_email
    FROM auth.users WHERE id = uid AND email_confirmed_at IS NOT NULL;
  END IF;

  SELECT * INTO target
  FROM public.orders AS o
  WHERE o.id = upper(trim(p_order_id))
    AND (
      (uid IS NOT NULL AND o.customer_id = uid)
      OR (confirmed_email IS NOT NULL AND lower(o.customer_email) = confirmed_email)
      OR (p_phone IS NOT NULL AND trim(p_phone) <> '' AND o.phone = trim(p_phone))
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'We could not find this order. Check the Order ID and phone number';
  END IF;

  IF target.status = 'Cancelled' THEN
    RETURN 'Cancelled';
  END IF;

  IF target.status NOT IN ('Pending', 'Confirmed') THEN
    RAISE EXCEPTION 'This order has already been dispatched and can no longer be cancelled';
  END IF;

  PERFORM set_config('app.order_cancel_by_customer', 'on', true);

  UPDATE public.orders
  SET status = 'Cancelled',
      cancel_reason = trim(p_reason),
      cancelled_by = 'customer',
      cancelled_at = now()
  WHERE id = target.id;

  PERFORM set_config('app.order_cancel_by_customer', 'off', true);

  RETURN 'Cancelled';
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_as_customer(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order_as_customer(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_orders()
RETURNS TABLE (
  id text,
  customer_name text,
  city text,
  total numeric,
  delivery_fee numeric,
  status text,
  created_at timestamptz,
  items jsonb,
  cancel_reason text,
  cancelled_by text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.customer_name, o.city, o.total, o.delivery_fee, o.status,
         o.created_at, o.items, o.cancel_reason, o.cancelled_by
  FROM public.orders AS o
  WHERE auth.uid() IS NOT NULL
    AND (
      o.customer_id = auth.uid()
      OR lower(o.customer_email) = (
        SELECT lower(u.email) FROM auth.users AS u
        WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
      )
    )
  ORDER BY o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.my_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_orders() TO authenticated;
