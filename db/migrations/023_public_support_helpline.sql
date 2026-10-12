-- Brand cleanup: replace leftover Dukaan.pk placeholder settings saved by the admin page.
UPDATE public.platform_settings
SET value = to_jsonb('azadari.store'::text), updated_at = now()
WHERE key = 'platform_name' AND value #>> '{}' ILIKE '%dukaan%';

-- "0311-DUKAAN" was a placeholder, not a real phone number.
UPDATE public.platform_settings
SET value = to_jsonb(''::text), updated_at = now()
WHERE key = 'support_helpline' AND value #>> '{}' ILIKE '%dukaan%';

UPDATE public.platform_settings
SET value = to_jsonb(replace(value #>> '{}', 'Â·', '·')), updated_at = now()
WHERE key = 'announcement_bar' AND value #>> '{}' LIKE '%Â·%';

-- Customers may read only the support helpline, not the whole settings table.
CREATE OR REPLACE FUNCTION public.support_helpline()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(trim(value #>> '{}'), '')
  FROM public.platform_settings
  WHERE key = 'support_helpline';
$$;

REVOKE ALL ON FUNCTION public.support_helpline() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.support_helpline() TO anon, authenticated;
