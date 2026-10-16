-- Put the 1,000 demo products into their matching subcategory, so the
-- storefront category menu shows subcategories (Dua Books, Quran Pak, Alam ...)
-- instead of only "View all".
--
-- Only demo products (id 'ISLAMIC-DEMO-xxxx') that still sit in the main
-- category are moved. Vendor products are never touched.
-- Each subcategory belongs to the same main category, so a product still shows
-- up when a customer opens the main category.
--
-- To undo: run the same statement with old_category and new_category swapped.

UPDATE public.products AS p
SET category = m.new_category
FROM (
  VALUES
    ('Black Azadari Kurta',       'Islamic Clothing',    'Black Kurta'),
    ('Premium Black Tasbeeh',     'Tasbeeh',             'Black Tasbeeh'),
    ('Quran Pak with Cover',      'Quran & Books',       'Quran Pak'),
    ('Dua Kumail Book',           'Quran & Books',       'Dua Books'),
    ('Majlis Black Banner',       'Majlis Items',        'Majlis Banners'),
    ('Decorative Alam',           'Alam & Zuljanah',     'Alam'),
    ('Zuljanah Decorative Piece', 'Alam & Zuljanah',     'Zuljanah Decoration'),
    ('Premium Janamaz',           'Prayer Essentials',   'Janamaz'),
    ('Turbat Pack',               'Azadari Accessories', 'Turbat Cases'),
    ('Islamic Bracelet',          'Accessories',         'Bracelets')
) AS m(product_name, old_category, new_category)
WHERE p.id LIKE 'ISLAMIC-DEMO-%'
  AND p.name = m.product_name
  AND p.category = m.old_category
  AND EXISTS (
    SELECT 1 FROM public.categories AS c
    WHERE c.name = m.new_category AND c.active = true
  );


-- Some demo products list a "was" price that is lower than (or equal to) the
-- real price, which the site would show as a fake discount. Clear those.
UPDATE public.products
SET compare_price = NULL
WHERE id LIKE 'ISLAMIC-DEMO-%'
  AND compare_price IS NOT NULL
  AND compare_price <= price;