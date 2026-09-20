-- Customer product ratings and reviews.
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_created_at_idx
ON public.product_reviews (product_id, created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public product reviews read" ON public.product_reviews;
CREATE POLICY "Public product reviews read"
ON public.product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users create own product reviews" ON public.product_reviews;
CREATE POLICY "Authenticated users create own product reviews"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own product reviews" ON public.product_reviews;
CREATE POLICY "Users update own product reviews"
ON public.product_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own product reviews" ON public.product_reviews;
CREATE POLICY "Users delete own product reviews"
ON public.product_reviews FOR DELETE TO authenticated
USING (user_id = auth.uid());

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
