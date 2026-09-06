-- Restore only the vendor profile fields required by public storefront pages.
-- Run after 012_rls_defense_in_depth.sql.
REVOKE ALL ON public.vendors FROM anon;
GRANT SELECT (id, name, contact, address, description, email, created_at)
ON public.vendors TO anon;
