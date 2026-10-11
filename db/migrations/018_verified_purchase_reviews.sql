-- Only customers with a delivered order containing a product can review it.
ALTER TABLE public.product_reviews
ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;

UPDATE public.product_reviews AS r
SET verified_purchase = true
WHERE EXISTS (
  SELECT 1
  FROM public.orders AS o
  WHERE o.customer_id = r.user_id
    AND o.status = 'Delivered'
    AND o.items @> jsonb_build_array(
      jsonb_build_object('id', r.product_id)
    )
);

DROP POLICY IF EXISTS "Public product reviews read"
ON public.product_reviews;
CREATE POLICY "Public product reviews read"
ON public.product_reviews FOR SELECT
USING (verified_purchase = true);

DROP POLICY IF EXISTS "Authenticated users create own product reviews"
ON public.product_reviews;
CREATE POLICY "Authenticated users create own product reviews"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND verified_purchase = true
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.customer_id = auth.uid()
      AND o.status = 'Delivered'
      AND o.items @> jsonb_build_array(
        jsonb_build_object('id', product_reviews.product_id)
      )
  )
);

DROP POLICY IF EXISTS "Users update own product reviews"
ON public.product_reviews;
CREATE POLICY "Users update own product reviews"
ON public.product_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND verified_purchase = true
  AND EXISTS (
    SELECT 1
    FROM public.orders AS o
    WHERE o.customer_id = auth.uid()
      AND o.status = 'Delivered'
      AND o.items @> jsonb_build_array(
        jsonb_build_object('id', product_reviews.product_id)
      )
  )
);
