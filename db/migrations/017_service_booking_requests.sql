-- Store public service booking requests without exposing customer contact data.
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL CHECK (char_length(service_id) BETWEEN 1 AND 100),
  service_name text NOT NULL CHECK (char_length(service_name) BETWEEN 1 AND 160),
  customer_name text NOT NULL CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(trim(phone)) BETWEEN 7 AND 32),
  details text CHECK (details IS NULL OR char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rejected', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_requests_created_at_idx
ON public.booking_requests (created_at DESC);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit service booking requests" ON public.booking_requests;
CREATE POLICY "Public can submit service booking requests"
ON public.booking_requests FOR INSERT TO anon, authenticated
WITH CHECK (status = 'Pending');

DROP POLICY IF EXISTS "Admins can read service booking requests" ON public.booking_requests;
CREATE POLICY "Admins can read service booking requests"
ON public.booking_requests FOR SELECT TO authenticated
USING (public.is_admin());

REVOKE ALL ON public.booking_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT (service_id, service_name, customer_name, phone, details)
ON public.booking_requests TO anon, authenticated;
GRANT SELECT ON public.booking_requests TO authenticated;
