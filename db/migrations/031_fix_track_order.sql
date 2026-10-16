-- Fix "Track Order": the website calls track_order(p_order_id, p_order_phone),
-- but the live database only had track_order(p_order_id, p_phone), so every
-- tracking attempt failed with "We couldn't reach the tracking service".
--
-- Also: phone numbers now match however they are typed
-- (0300-1234567, 03001234567, +92 300 1234567 are the same number).
-- The same matching is used for guest order cancellation.

CREATE OR REPLACE FUNCTION public.phone_matches(stored text, typed text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(regexp_replace(typed, '\D', '', 'g'), '') = '' THEN false
    WHEN regexp_replace(stored, '\D', '', 'g') = regexp_replace(typed, '\D', '', 'g') THEN true
    -- Compare the last 10 digits, so 0300... and +92 300... match.
    WHEN length(regexp_replace(typed, '\D', '', 'g')) >= 10
      AND right(regexp_replace(stored, '\D', '', 'g'), 10)
        = right(regexp_replace(typed, '\D', '', 'g'), 10) THEN true
    ELSE false
  END;
$$;

-- The old version's second parameter is named p_phone. Postgres can't rename a
-- parameter in place, so remove the old one first (nothing else uses it).
DROP FUNCTION IF EXISTS public.track_order(text, text);

CREATE FUNCTION public.track_order(p_order_id text, p_order_phone text)
RETURNS TABLE (id text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.status
  FROM public.orders AS o
  WHERE o.id = upper(trim(p_order_id))
    AND public.phone_matches(o.phone, p_order_phone)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;

-- Guest cancellation uses the same phone matching (otherwise as in 028).
CREATE OR REPLACE FUNCTION public.cancel_order_as_customer(
  p_order_id text,
  p_phone text,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  confirmed_email text;
  target public.orders%ROWTYPE;
BEGIN
  IF char_length(trim(COALESCE(p_reason, ''))) NOT BETWEEN 3 AND 300 THEN
    RAISE EXCEPTION 'Please choose a reason for cancelling';
  END IF;

  IF uid IS NOT NULL THEN
    SELECT lower(email) INTO confirmed_email
    FROM auth.users WHERE id = uid AND email_confirmed_at IS NOT NULL;
  END IF;

  SELECT * INTO target
  FROM public.orders AS o
  WHERE o.id = upper(trim(p_order_id))
    AND (
      (uid IS NOT NULL AND o.customer_id = uid)
      OR (confirmed_email IS NOT NULL AND lower(o.customer_email) = confirmed_email)
      OR public.phone_matches(o.phone, p_phone)
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'We could not find this order. Check the Order ID and phone number';
  END IF;

  IF target.status = 'Cancelled' THEN
    RETURN 'Cancelled';
  END IF;

  IF target.status NOT IN ('Pending', 'Confirmed') THEN
    RAISE EXCEPTION 'This order has already been dispatched and can no longer be cancelled';
  END IF;

  PERFORM set_config('app.order_cancel_by_customer', 'on', true);

  UPDATE public.orders
  SET status = 'Cancelled',
      cancel_reason = trim(p_reason),
      cancelled_by = 'customer',
      cancelled_at = now()
  WHERE id = target.id;

  PERFORM set_config('app.order_cancel_by_customer', 'off', true);

  RETURN 'Cancelled';
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_as_customer(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_order_as_customer(text, text, text) TO anon, authenticated;
