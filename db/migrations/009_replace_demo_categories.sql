-- Replace accidental demo categories with the marketplace categories.
-- Run in Supabase SQL Editor after 005_admin_operations.sql.
INSERT INTO public.categories (name, active)
VALUES
  ('Electronics', true),
  ('Fashion', true),
  ('Home & Living', true),
  ('Beauty', true),
  ('Mobile Accessories', true),
  ('Kids', true)
ON CONFLICT (name) DO UPDATE SET active = true;

DELETE FROM public.categories
WHERE name IN ('Bikes', 'Bikes34', 'Cars', 'Cycles', 'Earbuds', 'Honda', 'Honda232', 'Mobiles');
