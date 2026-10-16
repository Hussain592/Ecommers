-- Partner commissions: until now nothing ever created a commission row, so the
-- Commissions pages were always empty.
--
-- How it works:
--   * A partner works for one vendor and adds products for that store.
--   * When an order is marked Delivered, every product in it that a partner
--     added earns that partner a commission:
--         commission = (price x quantity) x partner_commission_rate / 100
--   * The commission is paid out of the vendor's share, so the vendor payout is
--         (order total - delivery fee) x (1 - commission_rate / 100) - partner commissions
--   * Admin approves the commission and later marks it Paid.
--   * If an admin moves a Delivered order back, the unpaid commissions and the
--     unpaid payout for that order are removed and created again on re-delivery.
--
-- Settings (Admin > Settings): commission_rate (platform, default 8) and
-- partner_commission_rate (default 5).

ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS partner_id uuid;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS vendor_id uuid;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS sale_amount numeric;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS commissions_order_id_idx ON public.commissions (order_id);

-- Reads a percentage setting; falls back to the default when missing or invalid.
CREATE OR REPLACE FUNCTION public.setting_percent(p_key text, p_default numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw text;
BEGIN
  SELECT value #>> '{}' INTO raw FROM public.platform_settings WHERE key = p_key;
  IF raw IS NOT NULL AND raw ~ '^[0-9]+(\.[0-9]+)?$' AND raw::numeric BETWEEN 0 AND 100 THEN
    RETURN raw::numeric;
  END IF;
  RETURN p_default;
END;
$$;

REVOKE ALL ON FUNCTION public.setting_percent(text, numeric) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_vendor_payout_for_delivered_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vendor_name text;
  platform_rate numeric := public.setting_percent('commission_rate', 8);
  partner_rate numeric := public.setting_percent('partner_commission_rate', 5);
  partner_total numeric := 0;
BEGIN
  -- Order moved back out of Delivered: remove what hasn't been paid yet.
  IF OLD.status = 'Delivered' AND NEW.status IS DISTINCT FROM 'Delivered' THEN
    DELETE FROM public.commissions
    WHERE order_id = NEW.id AND status = 'Pending';

    DELETE FROM public.payouts
    WHERE id = 'PYT-' || NEW.id AND status = 'Pending';

    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM 'Delivered' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1) One commission per partner-added product in the order.
  IF partner_rate > 0 THEN
    -- jsonb_populate_record converts every value to the live column type.
    INSERT INTO public.commissions (
      id, order_id, partner_id, partner_name, vendor_id, product_id, product_name,
      rate, sale_amount, quantity, amount, status, created_at
    )
    SELECT r.id, r.order_id, r.partner_id, r.partner_name, r.vendor_id, r.product_id,
           r.product_name, r.rate, r.sale_amount, r.quantity, r.amount, r.status, r.created_at
    FROM (
      SELECT
        line ->> 'id' AS product_id,
        max(line ->> 'name') AS product_name,
        sum((line ->> 'quantity')::integer) AS quantity,
        sum((line ->> 'price')::numeric * (line ->> 'quantity')::integer) AS sale_amount
      FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) AS line
      WHERE line ->> 'id' IS NOT NULL
        AND COALESCE(line ->> 'quantity', '') ~ '^[1-9][0-9]*$'
        AND COALESCE(line ->> 'price', '') ~ '^[0-9]+(\.[0-9]+)?$'
      GROUP BY line ->> 'id'
    ) AS s
    JOIN public.products AS p ON p.id = s.product_id
    JOIN public.users AS u ON u.auth_id = p.created_by AND u.role = 'partner'
    CROSS JOIN LATERAL jsonb_populate_record(
      NULL::public.commissions,
      jsonb_build_object(
        'id', 'COM-' || NEW.id || '-' || s.product_id,
        'order_id', NEW.id,
        'partner_id', u.id,
        'partner_name', COALESCE(NULLIF(trim(u.name), ''), 'Partner'),
        'vendor_id', NEW.vendor_id,
        'product_id', s.product_id,
        'product_name', s.product_name,
        'rate', partner_rate,
        'sale_amount', s.sale_amount,
        'quantity', s.quantity,
        'amount', round(s.sale_amount * partner_rate / 100, 2),
        'status', 'Pending',
        'created_at', now()
      )
    ) AS r
    ON CONFLICT (id) DO NOTHING;
  END IF;

  SELECT COALESCE(sum(amount), 0) INTO partner_total
  FROM public.commissions
  WHERE order_id = NEW.id;

  -- 2) Vendor payout: vendor share minus partner commissions.
  IF NEW.vendor_id IS NOT NULL THEN
    SELECT name INTO vendor_name FROM public.vendors WHERE id = NEW.vendor_id;

    IF vendor_name IS NOT NULL THEN
      INSERT INTO public.payouts (
        id, recipient_name, recipient_type, recipient_vendor_id,
        amount, method, status
      )
      VALUES (
        'PYT-' || NEW.id,
        vendor_name,
        'Vendor',
        NEW.vendor_id,
        GREATEST(
          0,
          round(
            (NEW.total - COALESCE(NEW.delivery_fee, 0)) * (1 - platform_rate / 100)
              - partner_total,
            2
          )
        ),
        'Bank Transfer',
        'Pending'
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_vendor_payout_for_delivered_order ON public.orders;
CREATE TRIGGER create_vendor_payout_for_delivered_order
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.create_vendor_payout_for_delivered_order();

-- Partners can see (never change) their own commissions.
DROP POLICY IF EXISTS "Partners read own commissions" ON public.commissions;
CREATE POLICY "Partners read own commissions"
ON public.commissions FOR SELECT TO authenticated
USING (
  partner_id::text IN (
    SELECT id::text FROM public.users WHERE auth_id = auth.uid() AND role = 'partner'
  )
);

GRANT SELECT ON public.commissions TO authenticated;
REVOKE ALL ON public.commissions FROM anon;

-- Default rates, so they show up in Admin > Settings.
INSERT INTO public.platform_settings (key, value)
VALUES ('commission_rate', '8'::jsonb), ('partner_commission_rate', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;
