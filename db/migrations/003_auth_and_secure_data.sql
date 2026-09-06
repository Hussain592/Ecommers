-- Run this in Supabase SQL Editor after 001_init.sql and 002_product_storage.sql.
-- Supabase Auth keeps passwords; public.users only stores the app profile.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS owner_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS alternate_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  app_role text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer');
  display_name text := COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, 'User'), '@', 1));
BEGIN
  IF app_role NOT IN ('customer', 'vendor', 'partner') THEN app_role := 'customer'; END IF;
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (NEW.id, NEW.email, display_name, app_role)
  ON CONFLICT (auth_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role;

  IF app_role IN ('vendor', 'partner') THEN
    INSERT INTO public.vendors (owner_id, name, contact, email)
    VALUES (NEW.id, display_name, NEW.phone, NEW.email)
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT TO authenticated USING (auth_id = auth.uid());
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO authenticated USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "Vendors public read" ON public.vendors;
CREATE POLICY "Vendors public read" ON public.vendors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Vendors update own" ON public.vendors;
CREATE POLICY "Vendors update own" ON public.vendors FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Public active product read" ON public.products;
CREATE POLICY "Public active product read" ON public.products FOR SELECT USING (active = true OR created_by = auth.uid());
DROP POLICY IF EXISTS "Vendors create products" ON public.products;
CREATE POLICY "Vendors create products" ON public.products FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Vendors update own products" ON public.products;
CREATE POLICY "Vendors update own products" ON public.products FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Vendors delete own products" ON public.products;
CREATE POLICY "Vendors delete own products" ON public.products FOR DELETE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Customers create orders" ON public.orders;
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Vendors view own orders" ON public.orders;
CREATE POLICY "Vendors view own orders" ON public.orders FOR SELECT TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS "Vendors update own orders" ON public.orders;
CREATE POLICY "Vendors update own orders" ON public.orders FOR UPDATE TO authenticated USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Public product image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public product image reads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload own product images" ON storage.objects;
CREATE POLICY "Authenticated users upload own product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Public product image read" ON storage.objects;
CREATE POLICY "Public product image read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
