-- Least-privilege API grants. Run after migrations 003 through 010.
-- RLS remains the authorization boundary; these grants remove unnecessary access.
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon;
GRANT SELECT ON public.products TO anon;

REVOKE INSERT, UPDATE, DELETE ON public.vendors FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon;
REVOKE SELECT, UPDATE, DELETE ON public.orders FROM anon;
GRANT INSERT ON public.orders TO anon;

REVOKE UPDATE, DELETE ON public.vendor_followers FROM anon;
REVOKE ALL ON public.categories FROM anon;
GRANT SELECT ON public.categories TO anon;

REVOKE ALL ON public.payouts FROM anon;
REVOKE ALL ON public.commissions FROM anon;
REVOKE ALL ON public.platform_settings FROM anon;
