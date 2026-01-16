-- Shipping Quote Line Items Table
-- Optional breakdown of quote amounts

-- =============================================================================
-- SHIPPING QUOTE LINE ITEMS TABLE
-- =============================================================================

CREATE TABLE shipping_quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_quote_id UUID NOT NULL REFERENCES shipping_quotes(id) ON DELETE CASCADE,

  -- Line item details
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,

  -- Ordering
  sort_order INT NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_shipping_quote_line_items_quote ON shipping_quote_line_items(shipping_quote_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_quote_line_items ENABLE ROW LEVEL SECURITY;

-- Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view shipping_quote_line_items"
  ON shipping_quote_line_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipping_quote_line_items"
  ON shipping_quote_line_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping_quote_line_items"
  ON shipping_quote_line_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shipping_quote_line_items"
  ON shipping_quote_line_items FOR DELETE TO authenticated USING (true);

-- Anonymous users can manage line items for quotes with valid token
CREATE POLICY "Anon users can view line items for valid quotes"
  ON shipping_quote_line_items FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shipping_quotes sq
      WHERE sq.id = shipping_quote_id
        AND sq.magic_link_token IS NOT NULL
        AND sq.token_expires_at > NOW()
    )
  );

CREATE POLICY "Anon users can insert line items for pending quotes"
  ON shipping_quote_line_items FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipping_quotes sq
      WHERE sq.id = shipping_quote_id
        AND sq.magic_link_token IS NOT NULL
        AND sq.token_expires_at > NOW()
        AND sq.status = 'pending'
    )
  );

CREATE POLICY "Anon users can delete line items for pending quotes"
  ON shipping_quote_line_items FOR DELETE TO anon
  USING (
    EXISTS (
      SELECT 1 FROM shipping_quotes sq
      WHERE sq.id = shipping_quote_id
        AND sq.magic_link_token IS NOT NULL
        AND sq.token_expires_at > NOW()
        AND sq.status = 'pending'
    )
  );
