-- Shipping Invoices Migration
-- Creates tables for tracking actual shipping invoices from winning quote agents

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Shipping invoice status enum
CREATE TYPE shipping_invoice_status AS ENUM (
  'received',   -- Invoice received from agent
  'approved',   -- Invoice approved for payment
  'paid'        -- Invoice has been paid
);

-- =============================================================================
-- SHIPPING INVOICES TABLE
-- =============================================================================

CREATE TABLE shipping_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to winning quote (required)
  shipping_quote_id UUID NOT NULL REFERENCES shipping_quotes(id) ON DELETE RESTRICT,

  -- Invoice details
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,

  -- Amount
  currency TEXT NOT NULL DEFAULT 'USD',
  total_amount NUMERIC(12, 2) NOT NULL,

  -- Notes and attachments
  notes TEXT,
  pdf_path TEXT,

  -- Status
  status shipping_invoice_status NOT NULL DEFAULT 'received',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SHIPPING INVOICE LINE ITEMS TABLE
-- =============================================================================

CREATE TABLE shipping_invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_invoice_id UUID NOT NULL REFERENCES shipping_invoices(id) ON DELETE CASCADE,

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

CREATE INDEX idx_shipping_invoices_quote ON shipping_invoices(shipping_quote_id);
CREATE INDEX idx_shipping_invoices_status ON shipping_invoices(status);
CREATE INDEX idx_shipping_invoices_invoice_date ON shipping_invoices(invoice_date);
CREATE INDEX idx_shipping_invoice_line_items_invoice ON shipping_invoice_line_items(shipping_invoice_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER shipping_invoices_updated_at
  BEFORE UPDATE ON shipping_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEW - Shipping invoice with variance calculation
-- =============================================================================

CREATE VIEW shipping_invoice_with_variance AS
SELECT
  si.id,
  si.shipping_quote_id,
  si.invoice_number,
  si.invoice_date,
  si.due_date,
  si.currency,
  si.total_amount AS invoice_amount,
  sq.total_amount AS quoted_amount,
  (si.total_amount - COALESCE(sq.total_amount, 0)) AS variance_amount,
  CASE
    WHEN sq.total_amount > 0 THEN
      ROUND(((si.total_amount - sq.total_amount) / sq.total_amount) * 100, 2)
    ELSE 0
  END AS variance_percent,
  si.notes,
  si.pdf_path,
  si.status,
  si.created_at,
  si.updated_at,
  -- Quote details
  sq.shipping_agent_id,
  sa.name AS shipping_agent_name
FROM shipping_invoices si
JOIN shipping_quotes sq ON sq.id = si.shipping_quote_id
JOIN shipping_agents sa ON sa.id = sq.shipping_agent_id;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Shipping invoices policies
CREATE POLICY "Authenticated users can view shipping_invoices"
  ON shipping_invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipping_invoices"
  ON shipping_invoices FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping_invoices"
  ON shipping_invoices FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shipping_invoices"
  ON shipping_invoices FOR DELETE TO authenticated USING (true);

-- Shipping invoice line items policies
CREATE POLICY "Authenticated users can view shipping_invoice_line_items"
  ON shipping_invoice_line_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipping_invoice_line_items"
  ON shipping_invoice_line_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping_invoice_line_items"
  ON shipping_invoice_line_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shipping_invoice_line_items"
  ON shipping_invoice_line_items FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- CONSTRAINT - Only allow invoice for selected quotes
-- =============================================================================

CREATE OR REPLACE FUNCTION check_quote_is_selected()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM shipping_quotes
    WHERE id = NEW.shipping_quote_id
      AND status = 'selected'
  ) THEN
    RAISE EXCEPTION 'Can only create invoice for a selected (winning) quote';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_invoice_quote_check
  BEFORE INSERT ON shipping_invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_quote_is_selected();
