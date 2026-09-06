-- Defense-in-depth RLS hardening. Run after migrations 003 through 011.
-- Public product images remain readable; writes are owner-scoped.
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.vendors FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.orders FROM anon;
REVOKE ALL ON public.payouts FROM anon;
REVOKE ALL ON public.commissions FROM anon;
REVOKE ALL ON public.platform_settings FROM anon;

DROP POLICY IF EXISTS "Authenticated users update own product images" ON storage.objects;
CREATE POLICY "Authenticated users update own product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users delete own product images" ON storage.objects;
CREATE POLICY "Authenticated users delete own product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP FUNCTION IF EXISTS public.track_order(text, text);

CREATE OR REPLACE FUNCTION public.track_order(p_order_id text, p_order_phone text)
RETURNS TABLE (id text, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.status
  FROM public.orders AS o
  WHERE o.id = p_order_id
    AND o.phone = p_order_phone
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;
