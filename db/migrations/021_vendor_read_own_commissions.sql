-- Vendors may read (never change) the partner commissions generated on their own store.
-- Admin policies from 005_admin_operations.sql stay unchanged.
DROP POLICY IF EXISTS "Vendors read own commissions" ON public.commissions;
CREATE POLICY "Vendors read own commissions"
ON public.commissions FOR SELECT TO authenticated
USING (
  vendor_id::text IN (
    SELECT id::text FROM public.vendors WHERE owner_id = auth.uid()
  )
);

GRANT SELECT ON public.commissions TO authenticated;
REVOKE ALL ON public.commissions FROM anon;
