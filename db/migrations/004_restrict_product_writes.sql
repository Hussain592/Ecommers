-- Run this after 003_auth_and_secure_data.sql.
-- Only vendor/partner accounts may create product listings.

DROP POLICY IF EXISTS "Vendors create products" ON public.products;
CREATE POLICY "Vendors create products" ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role IN ('vendor', 'partner')
  )
);
