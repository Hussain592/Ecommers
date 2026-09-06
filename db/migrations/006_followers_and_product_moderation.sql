-- Follows and product moderation for the public marketplace.
CREATE TABLE IF NOT EXISTS public.vendor_followers (
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vendor_id, user_id)
);

CREATE INDEX IF NOT EXISTS vendor_followers_vendor_id_idx ON public.vendor_followers (vendor_id);

ALTER TABLE public.vendor_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public follower count read" ON public.vendor_followers;
DROP POLICY IF EXISTS "Users view own follow" ON public.vendor_followers;
CREATE POLICY "Users view own follow"
ON public.vendor_followers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.vendor_follower_count(target_vendor_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.vendor_followers WHERE vendor_id = target_vendor_id;
$$;

GRANT EXECUTE ON FUNCTION public.vendor_follower_count(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Users follow vendors" ON public.vendor_followers;
CREATE POLICY "Users follow vendors"
ON public.vendor_followers FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users unfollow vendors" ON public.vendor_followers;
CREATE POLICY "Users unfollow vendors"
ON public.vendor_followers FOR DELETE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins moderate products" ON public.products;
DROP POLICY IF EXISTS "Admins read all products" ON public.products;
CREATE POLICY "Admins read all products"
ON public.products FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins moderate products"
ON public.products FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT ON public.vendor_followers TO authenticated;
GRANT INSERT, DELETE ON public.vendor_followers TO authenticated;
