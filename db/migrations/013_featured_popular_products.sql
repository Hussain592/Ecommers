-- Curated and popular product ranking for the public marketplace.
-- Run after migrations 010 through 012.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sales_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_public_ranking_idx
ON public.products (active, featured, sales_count DESC, created_at DESC);

DROP POLICY IF EXISTS "Admins moderate product ranking" ON public.products;
CREATE POLICY "Admins moderate product ranking"
ON public.products FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
