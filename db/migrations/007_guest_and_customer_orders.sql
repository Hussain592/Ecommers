-- Persist COD orders for both guests and signed-in customers.
-- Run after 003_auth_and_secure_data.sql.
DROP POLICY IF EXISTS "Guests create COD orders" ON public.orders;
CREATE POLICY "Guests create COD orders"
ON public.orders FOR INSERT TO anon
WITH CHECK (
  customer_id IS NULL
  AND customer_name IS NOT NULL
  AND phone IS NOT NULL
  AND address IS NOT NULL
);

DROP POLICY IF EXISTS "Customers create orders" ON public.orders;
CREATE POLICY "Customers create orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

GRANT INSERT ON public.orders TO anon, authenticated;
