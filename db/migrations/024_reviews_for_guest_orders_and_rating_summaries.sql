-- 1) Let customers review products from orders they placed as a guest.
--    A guest order counts as theirs when its customer_email matches the
--    customer's *confirmed* account email. Unconfirmed emails never match,
--    so nobody can claim someone else's order by signing up with their email.
--
-- 2) Public per-product rating summaries so product cards can show stars.

CREATE OR REPLACE FUNCTION public.customer_purchase_status(p_product_id text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  confirmed_email text;
BEGIN
  IF uid IS NULL OR p_product_id IS NULL THEN
    RETURN 'none';
  END IF;

  SELECT lower(email) INTO confirmed_email
  FROM auth.users
  WHERE id = uid AND email_confirmed_at IS NOT NULL;

  IF EXISTS (
    SELECT 1 FROM public.orders AS o
    WHERE o.status = 'Delivered'
      AND (
        o.customer_id = uid
        OR (confirmed_email IS NOT NULL AND lower(o.customer_email) = confirmed_email)
      )
      AND o.items @> jsonb_build_array(jsonb_build_object('id', p_product_id))
  ) THEN
    RETURN 'delivered';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders AS o
    WHERE o.status NOT IN ('Delivered', 'Cancelled')
      AND (
        o.customer_id = uid
        OR (confirmed_email IS NOT NULL AND lower(o.customer_email) = confirmed_email)
      )
      AND o.items @> jsonb_build_array(jsonb_build_object('id', p_product_id))
  ) THEN
    RETURN 'in_progress';
  END IF;

  RETURN 'none';
END;
$$;

REVOKE ALL ON FUNCTION public.customer_purchase_status(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_purchase_status(text) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users create own product reviews"
ON public.product_reviews;
CREATE POLICY "Authenticated users create own product reviews"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND verified_purchase = true
  AND public.customer_purchase_status(product_reviews.product_id) = 'delivered'
);

DROP POLICY IF EXISTS "Users update own product reviews"
ON public.product_reviews;
CREATE POLICY "Users update own product reviews"
ON public.product_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND verified_purchase = true
  AND public.customer_purchase_status(product_reviews.product_id) = 'delivered'
);

CREATE OR REPLACE FUNCTION public.product_rating_summaries()
RETURNS TABLE (product_id text, rating numeric, review_count integer)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    r.product_id,
    round(avg(r.rating)::numeric, 1) AS rating,
    count(*)::integer AS review_count
  FROM public.product_reviews AS r
  WHERE r.verified_purchase = true
  GROUP BY r.product_id;
$$;

GRANT EXECUTE ON FUNCTION public.product_rating_summaries() TO anon, authenticated;
