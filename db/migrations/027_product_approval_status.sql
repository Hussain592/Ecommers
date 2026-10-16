-- Clear product approval workflow.
--
-- Before: "active = false" meant three different things (new and waiting,
-- hidden by the admin, or rejected), so the admin could not tell new products
-- apart and the bell counted every hidden product as "waiting for approval".
--
-- After:
--   approval_status = 'pending'  -> new product, waiting for the admin
--   approval_status = 'approved' -> approved; the admin can show (active) or hide it
--   approval_status = 'rejected' -> rejected, with a reason the vendor can read
--
-- Rules (enforced by the database, not just the website):
--   * Vendors and partners can add and edit products, never publish, hide,
--     approve or feature them. That is the admin's job.
--   * Every new product from a vendor or partner starts as 'pending'.
--   * Editing a rejected product sends it back to 'pending' for another review.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_approval_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS products_approval_status_idx
  ON public.products (approval_status, created_at DESC);

-- Remove the old rule before backfilling, so this script itself is not blocked.
DROP TRIGGER IF EXISTS product_approval_required ON public.products;
DROP TRIGGER IF EXISTS product_approval_guard ON public.products;

-- Backfill: hidden products that a vendor or partner added and that were
-- never reviewed are the real approval queue. Demo products and anything
-- the admin added count as "approved but hidden".
UPDATE public.products AS p
SET approval_status = 'pending'
WHERE p.active = false
  AND p.reviewed_at IS NULL
  AND p.approval_status = 'approved'
  AND p.id NOT LIKE 'ISLAMIC-DEMO-%'
  AND EXISTS (
    SELECT 1 FROM public.users AS u
    WHERE u.auth_id = p.created_by AND u.role IN ('vendor', 'partner')
  );

-- Live products are approved by definition.
UPDATE public.products
SET reviewed_at = COALESCE(reviewed_at, now())
WHERE active = true AND approval_status = 'approved';

CREATE OR REPLACE FUNCTION public.enforce_product_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The admin, and trusted server code (SQL editor, checkout functions), may change anything.
  IF public.is_admin() OR auth.uid() IS NULL THEN
    -- Keep the two fields consistent: a live product is always an approved one.
    IF NEW.active AND NEW.approval_status <> 'approved' THEN
      NEW.approval_status := 'approved';
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approval_status := 'pending';
    NEW.active := false;
    NEW.featured := false;
    NEW.reviewed_at := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  -- Vendors and partners may edit product details, but not visibility or approval.
  NEW.active := OLD.active;
  NEW.featured := OLD.featured;
  NEW.approval_status := OLD.approval_status;
  NEW.reviewed_at := OLD.reviewed_at;
  NEW.rejection_reason := OLD.rejection_reason;

  -- Fixing a rejected product puts it back in the admin's queue.
  IF OLD.approval_status = 'rejected' THEN
    NEW.approval_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER product_approval_guard
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_approval();

-- Summary so you can see the result straight away in the SQL editor.
SELECT approval_status, active, count(*) AS products
FROM public.products
GROUP BY approval_status, active
ORDER BY approval_status, active;
