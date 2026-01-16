-- Shipping Quote Transfers Junction Table
-- Links shipping quotes to one or more transfers (for consolidated shipments)

-- =============================================================================
-- SHIPPING QUOTE TRANSFERS JUNCTION TABLE
-- =============================================================================

CREATE TABLE shipping_quote_transfers (
  shipping_quote_id UUID NOT NULL REFERENCES shipping_quotes(id) ON DELETE CASCADE,
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite primary key
  PRIMARY KEY (shipping_quote_id, transfer_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_shipping_quote_transfers_quote ON shipping_quote_transfers(shipping_quote_id);
CREATE INDEX idx_shipping_quote_transfers_transfer ON shipping_quote_transfers(transfer_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_quote_transfers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view shipping_quote_transfers"
  ON shipping_quote_transfers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipping_quote_transfers"
  ON shipping_quote_transfers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shipping_quote_transfers"
  ON shipping_quote_transfers FOR DELETE TO authenticated USING (true);

-- Anonymous users can view quote transfers via magic link
CREATE POLICY "Anon users can view quote transfers for valid quotes"
  ON shipping_quote_transfers FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shipping_quotes sq
      WHERE sq.id = shipping_quote_id
        AND sq.magic_link_token IS NOT NULL
        AND sq.token_expires_at > NOW()
    )
  );
