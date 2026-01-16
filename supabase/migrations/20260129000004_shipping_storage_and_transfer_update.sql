-- Shipping Documents Storage and Transfer Update
-- Creates storage bucket for quote/invoice PDFs and adds quote tracking to transfers

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-documents', 'shipping-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shipping documents
CREATE POLICY "Authenticated users can upload shipping documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shipping-documents');

CREATE POLICY "Authenticated users can view shipping documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'shipping-documents');

CREATE POLICY "Authenticated users can update shipping documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'shipping-documents');

CREATE POLICY "Authenticated users can delete shipping documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'shipping-documents');

-- Anonymous users can upload to shipping-documents for quote submissions
CREATE POLICY "Anon users can upload shipping documents"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'shipping-documents');

-- Anonymous users can view shipping documents (for their quote)
CREATE POLICY "Anon users can view shipping documents"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'shipping-documents');

-- =============================================================================
-- UPDATE TRANSFERS TABLE
-- =============================================================================

-- Add quote_confirmed_at column to track when a shipping quote was selected
-- This gates when a transfer can move to in-transit status
ALTER TABLE transfers
ADD COLUMN quote_confirmed_at TIMESTAMPTZ;

-- Add index for filtering transfers by quote status
CREATE INDEX idx_transfers_quote_confirmed ON transfers(quote_confirmed_at);

-- =============================================================================
-- VIEW - Transfers with quote status
-- =============================================================================

CREATE OR REPLACE VIEW transfer_quote_status AS
SELECT
  t.id AS transfer_id,
  t.transfer_number,
  t.quote_confirmed_at,
  CASE
    WHEN t.quote_confirmed_at IS NOT NULL THEN 'confirmed'
    WHEN EXISTS (
      SELECT 1 FROM shipping_quote_transfers sqt
      JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
      WHERE sqt.transfer_id = t.id AND sq.status = 'submitted'
    ) THEN 'quotes_received'
    WHEN EXISTS (
      SELECT 1 FROM shipping_quote_transfers sqt
      JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
      WHERE sqt.transfer_id = t.id AND sq.status = 'pending'
    ) THEN 'awaiting_quotes'
    ELSE 'no_quotes'
  END AS quote_status,
  (
    SELECT sq.total_amount
    FROM shipping_quote_transfers sqt
    JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
    WHERE sqt.transfer_id = t.id AND sq.status = 'selected'
    LIMIT 1
  ) AS selected_quote_amount,
  (
    SELECT sq.id
    FROM shipping_quote_transfers sqt
    JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
    WHERE sqt.transfer_id = t.id AND sq.status = 'selected'
    LIMIT 1
  ) AS selected_quote_id,
  (
    SELECT COUNT(*)
    FROM shipping_quote_transfers sqt
    JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
    WHERE sqt.transfer_id = t.id
  ) AS total_quotes,
  (
    SELECT COUNT(*)
    FROM shipping_quote_transfers sqt
    JOIN shipping_quotes sq ON sq.id = sqt.shipping_quote_id
    WHERE sqt.transfer_id = t.id AND sq.status = 'submitted'
  ) AS submitted_quotes
FROM transfers t;
