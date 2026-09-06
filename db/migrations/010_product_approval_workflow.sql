-- Require admin approval before newly submitted products become public.
-- Run after 006_followers_and_product_moderation.sql.
CREATE OR REPLACE FUNCTION public.enforce_product_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active = true AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.active = false) THEN
      RAISE EXCEPTION 'Product approval by admin is required before publishing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_approval_required ON public.products;
CREATE TRIGGER product_approval_required
BEFORE INSERT OR UPDATE OF active ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_approval();
