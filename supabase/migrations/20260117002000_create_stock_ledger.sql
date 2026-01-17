-- Stock Ledger Migration
-- Creates immutable ledger for stock movements and computed stock positions

-- =============================================================================
-- TABLES
-- =============================================================================

-- Stock ledger entries: Immutable record of every stock movement
CREATE TABLE stock_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What stock is moving
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,

  -- Where (location)
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  -- How much (+ve = credit/in, -ve = debit/out)
  quantity INT NOT NULL,

  -- Movement details
  movement_type stock_movement_type NOT NULL,

  -- Cost tracking (FIFO - preserve original batch cost)
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Link to transfer (for transfer_in/transfer_out types)
  transfer_id UUID, -- Future FK to transfers table
  transfer_line_item_id UUID, -- Future FK to transfer_line_items

  -- Reason and notes
  reason TEXT NOT NULL,
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system'
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_stock_ledger_batch ON stock_ledger_entries(batch_id);
CREATE INDEX idx_stock_ledger_location ON stock_ledger_entries(location_id);
CREATE INDEX idx_stock_ledger_sku ON stock_ledger_entries(sku);
CREATE INDEX idx_stock_ledger_type ON stock_ledger_entries(movement_type);
CREATE INDEX idx_stock_ledger_created ON stock_ledger_entries(created_at);
CREATE INDEX idx_stock_ledger_transfer ON stock_ledger_entries(transfer_id) WHERE transfer_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX idx_stock_ledger_batch_location ON stock_ledger_entries(batch_id, location_id);

-- =============================================================================
-- VIEW: Stock Positions (computed from ledger)
-- =============================================================================

-- This view computes current stock by summing ledger entries
CREATE VIEW stock_positions AS
SELECT
  batch_id,
  location_id,
  sku,
  product_name,
  SUM(quantity) AS total_quantity,
  SUM(quantity) FILTER (WHERE quantity > 0) AS total_in,
  ABS(SUM(quantity) FILTER (WHERE quantity < 0)) AS total_out,
  MIN(created_at) AS first_received_at,
  MAX(created_at) AS last_movement_at,
  -- Get the unit cost from the batch (FIFO - cost stays with batch)
  (SELECT unit_cost FROM batches WHERE id = sle.batch_id) AS unit_cost,
  (SELECT unit_cost FROM batches WHERE id = sle.batch_id) * SUM(quantity) AS total_value
FROM stock_ledger_entries sle
GROUP BY batch_id, location_id, sku, product_name
HAVING SUM(quantity) != 0; -- Only show positions with stock

-- =============================================================================
-- VIEW: Stock by Location (with location details)
-- =============================================================================

CREATE VIEW stock_by_location AS
SELECT
  sp.batch_id,
  sp.location_id,
  l.name AS location_name,
  l.type AS location_type,
  sp.sku,
  sp.product_name,
  sp.total_quantity,
  sp.total_in,
  sp.total_out,
  sp.first_received_at,
  sp.last_movement_at,
  sp.unit_cost,
  sp.total_value,
  po.po_number,
  b.batch_number,
  b.supplier_id,
  s.name AS supplier_name
FROM stock_positions sp
JOIN locations l ON l.id = sp.location_id
JOIN batches b ON b.id = sp.batch_id
LEFT JOIN purchase_orders po ON po.id = b.po_id
LEFT JOIN suppliers s ON s.id = b.supplier_id;

-- =============================================================================
-- VIEW: Stock by Product (aggregated across locations)
-- =============================================================================

CREATE VIEW stock_by_product AS
SELECT
  sku,
  product_name,
  COUNT(DISTINCT location_id) AS location_count,
  COUNT(DISTINCT batch_id) AS batch_count,
  SUM(total_quantity) AS total_quantity,
  SUM(total_value) AS total_value,
  MIN(first_received_at) AS earliest_receipt,
  MAX(last_movement_at) AS latest_movement
FROM stock_positions
GROUP BY sku, product_name;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE stock_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock_ledger_entries"
  ON stock_ledger_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock_ledger_entries"
  ON stock_ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies - ledger is immutable
-- Corrections should be made with new adjustment entries

-- =============================================================================
-- HELPER FUNCTION: Get current stock at location
-- =============================================================================

CREATE OR REPLACE FUNCTION get_stock_at_location(p_location_id UUID)
RETURNS TABLE (
  batch_id UUID,
  sku TEXT,
  product_name TEXT,
  total_quantity BIGINT,
  unit_cost DECIMAL,
  total_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sle.batch_id,
    sle.sku,
    sle.product_name,
    SUM(sle.quantity)::BIGINT AS total_quantity,
    b.unit_cost,
    (b.unit_cost * SUM(sle.quantity))::DECIMAL AS total_value
  FROM stock_ledger_entries sle
  JOIN batches b ON b.id = sle.batch_id
  WHERE sle.location_id = p_location_id
  GROUP BY sle.batch_id, sle.sku, sle.product_name, b.unit_cost
  HAVING SUM(sle.quantity) > 0
  ORDER BY MIN(sle.created_at); -- FIFO ordering
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTION: Get stock for batch across all locations
-- =============================================================================

CREATE OR REPLACE FUNCTION get_stock_for_batch(p_batch_id UUID)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  location_type location_type,
  quantity BIGINT,
  first_received_at TIMESTAMPTZ,
  last_movement_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sle.location_id,
    l.name AS location_name,
    l.type AS location_type,
    SUM(sle.quantity)::BIGINT AS quantity,
    MIN(sle.created_at) AS first_received_at,
    MAX(sle.created_at) AS last_movement_at
  FROM stock_ledger_entries sle
  JOIN locations l ON l.id = sle.location_id
  WHERE sle.batch_id = p_batch_id
  GROUP BY sle.location_id, l.name, l.type
  HAVING SUM(sle.quantity) != 0;
END;
$$ LANGUAGE plpgsql;
