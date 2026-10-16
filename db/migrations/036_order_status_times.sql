-- Track Order showed the same demo dates ("06 Aug, 10:12 AM") on every order,
-- because orders only stored when they were placed. Now the time of every
-- status change is saved and Track Order shows the real dates.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE OR REPLACE FUNCTION public.stamp_order_status_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Confirmed' AND NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    ELSIF NEW.status = 'Dispatched' AND NEW.dispatched_at IS NULL THEN
      NEW.dispatched_at := now();
    ELSIF NEW.status = 'Delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE triggers run in name order. The "zz_" name makes this run after the
-- order guard, which only lets vendors change the status column.
DROP TRIGGER IF EXISTS zz_stamp_order_status_time ON public.orders;
CREATE TRIGGER zz_stamp_order_status_time
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.stamp_order_status_time();

-- track_order now also returns the dates (same matching as 031).
DROP FUNCTION IF EXISTS public.track_order(text, text);

CREATE FUNCTION public.track_order(p_order_id text, p_order_phone text)
RETURNS TABLE (
  id text,
  status text,
  created_at timestamptz,
  confirmed_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.status, o.created_at, o.confirmed_at, o.dispatched_at,
         o.delivered_at, o.cancelled_at
  FROM public.orders AS o
  WHERE o.id = upper(trim(p_order_id))
    AND public.phone_matches(o.phone, p_order_phone)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;
