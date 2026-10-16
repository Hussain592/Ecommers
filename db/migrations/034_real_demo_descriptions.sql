-- 980 demo products told customers "Islamic demo product ... Suitable for
-- marketplace UI testing". Replace that with a plain, honest description.
-- Only the exact demo text is changed; descriptions written by vendors are untouched.
UPDATE public.products
SET description = name || ' from the ' || COALESCE(NULLIF(trim(category), ''), 'Islamic')
  || ' collection on azadari.store. Check the photos, price and seller details above, '
  || 'and pay in cash when your parcel arrives.'
WHERE id LIKE 'ISLAMIC-DEMO-%'
  AND description ILIKE 'Islamic demo product for azadari.store%';
