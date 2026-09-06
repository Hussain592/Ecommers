-- Secure guest order tracking by exact order ID and phone.
-- Run after 007_guest_and_customer_orders.sql.
CREATE OR REPLACE FUNCTION public.track_order(order_id text, order_phone text)
RETURNS TABLE (id text, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.status
  FROM public.orders AS o
  WHERE o.id = order_id
    AND o.phone = order_phone
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;
