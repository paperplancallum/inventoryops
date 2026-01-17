-- Supplier Invoice Submission Attachments Migration
-- Adds storage bucket and table for invoice document uploads (PDF, Excel)

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

-- Create storage bucket for supplier invoice attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supplier-invoice-attachments',
  'supplier-invoice-attachments',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ATTACHMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS supplier_invoice_submission_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES supplier_invoice_submissions(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Metadata
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission
  ON supplier_invoice_submission_attachments(submission_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE supplier_invoice_submission_attachments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view and manage attachments
CREATE POLICY "Authenticated users can view supplier_invoice_submission_attachments"
  ON supplier_invoice_submission_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier_invoice_submission_attachments"
  ON supplier_invoice_submission_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete supplier_invoice_submission_attachments"
  ON supplier_invoice_submission_attachments FOR DELETE
  TO authenticated
  USING (true);

-- Anonymous users can insert attachments (for form submissions)
CREATE POLICY "Anon can insert supplier_invoice_submission_attachments"
  ON supplier_invoice_submission_attachments FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Allow anonymous uploads (for magic link form submissions)
CREATE POLICY "Allow anonymous uploads to supplier-invoice-attachments"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'supplier-invoice-attachments');

-- Allow authenticated users to read all attachments
CREATE POLICY "Allow authenticated read on supplier-invoice-attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'supplier-invoice-attachments');

-- Allow authenticated users to delete attachments
CREATE POLICY "Allow authenticated delete on supplier-invoice-attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'supplier-invoice-attachments');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE supplier_invoice_submission_attachments IS 'File attachments for supplier invoice submissions (PDF, Excel, images)';
COMMENT ON COLUMN supplier_invoice_submission_attachments.file_path IS 'Path to file in supplier-invoice-attachments storage bucket';
