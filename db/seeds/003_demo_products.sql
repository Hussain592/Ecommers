-- Add 1,000 safe demo products for pagination testing.
-- Run after 001_init.sql and after at least one vendor exists.
INSERT INTO public.products (id, name, description, image, price, stock, category, vendor_id, active)
SELECT
  'DEMO-' || lpad(series::text, 4, '0'),
  'Demo Product ' || series,
  'Quality demo product for testing the Dukaan.pk marketplace experience.',
  'https://picsum.photos/seed/dukaan-product-' || series || '/800/800',
  499 + ((series * 137) % 9500),
  10 + (series % 90),
  CASE series % 6
    WHEN 0 THEN 'Electronics'
    WHEN 1 THEN 'Fashion'
    WHEN 2 THEN 'Home & Living'
    WHEN 3 THEN 'Beauty'
    WHEN 4 THEN 'Mobile Accessories'
    ELSE 'Kids'
  END,
  (SELECT id FROM public.vendors ORDER BY created_at LIMIT 1),
  true
FROM generate_series(1, 1000) AS series
WHERE EXISTS (SELECT 1 FROM public.vendors)
ON CONFLICT (id) DO UPDATE SET
  image = EXCLUDED.image,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  category = EXCLUDED.category,
  vendor_id = EXCLUDED.vendor_id,
  active = EXCLUDED.active;
