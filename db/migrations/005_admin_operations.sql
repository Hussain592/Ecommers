-- Run after 004. Admin-only operational data.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'); $$;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payouts (
  id text PRIMARY KEY, recipient_name text NOT NULL, recipient_type text NOT NULL, amount numeric NOT NULL,
  method text, status text NOT NULL DEFAULT 'Pending', created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.commissions (
  id text PRIMARY KEY, order_id text REFERENCES public.orders(id) ON DELETE SET NULL, partner_name text,
  rate numeric NOT NULL, amount numeric NOT NULL, status text NOT NULL DEFAULT 'Pending', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (active OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins manage payouts" ON public.payouts;
CREATE POLICY "Admins manage payouts" ON public.payouts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins manage commissions" ON public.commissions;
CREATE POLICY "Admins manage commissions" ON public.commissions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings" ON public.platform_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins read all users" ON public.users;
CREATE POLICY "Admins read all users" ON public.users FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins read all vendors" ON public.vendors;
CREATE POLICY "Admins read all vendors" ON public.vendors FOR SELECT TO authenticated USING (public.is_admin());

-- Promote your owner account after creating it:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
