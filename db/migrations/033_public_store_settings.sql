-- Admin > Settings had options that the website never read (Announcement Bar,
-- Return Window, Guest checkout). This makes them work.

-- Customers may read only these settings, not the whole settings table.
CREATE OR REPLACE FUNCTION public.public_store_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'announcement_bar',
      (SELECT nullif(trim(value #>> '{}'), '') FROM public.platform_settings WHERE key = 'announcement_bar'),
    'return_window',
      (SELECT value #>> '{}' FROM public.platform_settings WHERE key = 'return_window'),
    'guest_checkout',
      (SELECT value #>> '{}' FROM public.platform_settings WHERE key = 'guest_checkout')
  );
$$;

REVOKE ALL ON FUNCTION public.public_store_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_store_settings() TO anon, authenticated;

-- Guest checkout off: orders need a signed-in customer. Enforced here so it
-- can't be skipped by calling the API directly.
CREATE OR REPLACE FUNCTION public.enforce_guest_checkout_setting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
    AND COALESCE(auth.role(), '') = 'anon'
    AND EXISTS (
      SELECT 1 FROM public.platform_settings
      WHERE key = 'guest_checkout' AND value #>> '{}' = 'false'
    )
  THEN
    RAISE EXCEPTION 'Please sign in to place your order';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_guest_checkout_setting ON public.orders;
CREATE TRIGGER enforce_guest_checkout_setting
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_guest_checkout_setting();

-- The old default text repeated a fixed "Rs. 3,000" that could disagree with the
-- delivery settings. Empty now means "show delivery info automatically".
UPDATE public.platform_settings
SET value = to_jsonb(''::text), updated_at = now()
WHERE key = 'announcement_bar'
  AND value #>> '{}' IN (
    'Cash on Delivery all over Pakistan · Free delivery above Rs. 3,000',
    'Cash on Delivery all over Pakistan Â· Free delivery above Rs. 3,000'
  );
