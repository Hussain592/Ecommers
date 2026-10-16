-- Remove the serial number at the end of demo product names,
-- e.g. "Black Azadari Kurta 996" becomes "Black Azadari Kurta".
--
-- Only the 1,000 seeded demo products (id 'ISLAMIC-DEMO-xxxx') are touched.
-- Products added by vendors keep their names exactly as written,
-- so names like "IPhone 17 pro max" are never changed.
--
-- To undo: the number is still in the id, so it can be restored with
--   UPDATE public.products
--   SET name = name || ' ' || ltrim(substring(id FROM '[0-9]+$'), '0')
--   WHERE id LIKE 'ISLAMIC-DEMO-%';

UPDATE public.products
SET name = regexp_replace(name, '\s+[0-9]+$', '')
WHERE id LIKE 'ISLAMIC-DEMO-%'
  AND name ~ '\s[0-9]+$';
