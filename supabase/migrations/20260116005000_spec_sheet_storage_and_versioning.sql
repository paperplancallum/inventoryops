-- Migration: Create spec sheet storage bucket and enable versioning
-- Fixes: Storage bucket missing, UNIQUE constraint prevents version history

-- ============================================================
-- ADD STORAGE PATH COLUMN FOR DELETION
-- ============================================================

ALTER TABLE product_spec_sheets
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- ============================================================
-- CREATE STORAGE BUCKET FOR SPEC SHEETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-spec-sheets',
  'product-spec-sheets',
  true,  -- Public for easy download URLs
  10485760,  -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Allow authenticated users to upload spec sheets
CREATE POLICY "Authenticated users can upload spec sheets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-spec-sheets');

-- Allow authenticated users to read spec sheets
CREATE POLICY "Authenticated users can read spec sheets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-spec-sheets');

-- Allow authenticated users to delete spec sheets
CREATE POLICY "Authenticated users can delete spec sheets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-spec-sheets');

-- Allow public read access (for download URLs)
CREATE POLICY "Public can read spec sheets"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'product-spec-sheets');

-- ============================================================
-- REMOVE UNIQUE CONSTRAINT TO ALLOW VERSION HISTORY
-- ============================================================

ALTER TABLE product_spec_sheets
  DROP CONSTRAINT IF EXISTS product_spec_sheets_product_unique;

-- Add index for efficient queries by product_id
CREATE INDEX IF NOT EXISTS idx_product_spec_sheets_product_version
  ON product_spec_sheets(product_id, uploaded_at DESC);
