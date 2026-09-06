-- Run this once in the Supabase SQL Editor after 001_init.sql.
-- It adds the fields used by the vendor product form and a public image bucket.

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price numeric;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- This project currently has no authentication. These policies let the configured
-- anonymous browser client upload product images and save products. Replace them
-- with owner-based policies once Supabase Auth/vendor accounts are added.
DROP POLICY IF EXISTS "Public product image uploads" ON storage.objects;
CREATE POLICY "Public product image uploads"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public product image reads" ON storage.objects;
CREATE POLICY "Public product image reads"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'product-images');

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products TO anon, authenticated;
