-- OPTIONAL: run only if you agree. Hides 18 test products (Pand "gherhugth",
-- "youtube", "Hussain jee Full Stack Ai ddev", phones and bikes, etc.) from
-- customers. Nothing is deleted: they move to Admin > Products > Hidden, where
-- each one can be shown again with one click.
-- The two "Alam" test products are kept, since you used them to check the Alam category.
UPDATE public.products
SET active = false
WHERE active = true
  AND id IN (
    SELECT id FROM public.products
    WHERE id NOT LIKE 'ISLAMIC-DEMO-%'
      AND (
        description ~* '^(gherhugth|fje9heruthuyhytr|dnfbcb|hdwueifetu|dfbnjmk|1234567|234567|youtube\.com)$'
        OR description ILIKE '%by hussain%'
        OR description ILIKE 'mad by hussain%'
        OR description ILIKE 'Hussain jee Full Stack%'
        OR description ILIKE 'this is the most expencive earbuds%'
        OR category IN ('Mobiles', 'Mobile Accessories', 'Earbuds', 'Bikes', 'Bikes34', 'Honda', 'Cars', 'eef')
      )
  );
