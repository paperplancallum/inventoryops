-- COGS Module: Inventory Losses
-- Track damaged, lost, and disposed inventory for COGS calculation

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

CREATE TYPE inventory_loss_type AS ENUM (
  'damaged_inbound',       -- Damaged during inbound shipping to Amazon
  'damaged_warehouse',     -- Damaged at Amazon warehouse
  'damaged_customer',      -- Customer damaged return (unsellable)
  'lost_inbound',          -- Lost during inbound shipping
  'lost_warehouse',        -- Lost at Amazon warehouse
  'disposed',              -- Disposed by Amazon
  'expired',               -- Expired product
  'recalled',              -- Product recall
  'write_off'              -- Manual write-off
);

CREATE TYPE reimbursement_status AS ENUM (
  'none',           -- No reimbursement expected
  'pending',        -- Reimbursement requested/expected
  'partial',        -- Partially reimbursed
  'complete',       -- Fully reimbursed
  'denied'          -- Reimbursement denied
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Inventory Losses: Track damaged/lost inventory as COGS
CREATE TABLE inventory_losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Loss classification
  loss_type inventory_loss_type NOT NULL,
  description TEXT,

  -- What was lost
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  seller_sku TEXT NOT NULL,
  fnsku TEXT,

  -- Marketplace (for Amazon losses)
  marketplace amazon_marketplace,

  -- Quantity
  quantity INT NOT NULL CHECK (quantity > 0),

  -- Cost (from batch or estimated)
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Reimbursement tracking
  reimbursement_status reimbursement_status NOT NULL DEFAULT 'none',
  reimbursement_amount DECIMAL(12, 2) DEFAULT 0,
  reimbursement_date DATE,
  reimbursement_reference TEXT,  -- Amazon case/transaction ID

  -- Net loss (cost - reimbursement)
  net_loss DECIMAL(12, 2) GENERATED ALWAYS AS
    ((quantity * unit_cost) - COALESCE(reimbursement_amount, 0)) STORED,

  -- Date
  loss_date DATE NOT NULL,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual', 'sp-api', 'reconciliation', 'import'
  source_reference TEXT,  -- External reference
  amazon_case_id TEXT,

  -- COGS toggle
  include_in_cogs BOOLEAN NOT NULL DEFAULT true,

  -- Notes
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_inventory_losses_type ON inventory_losses(loss_type);
CREATE INDEX idx_inventory_losses_batch ON inventory_losses(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_inventory_losses_product ON inventory_losses(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_inventory_losses_date ON inventory_losses(loss_date);
CREATE INDEX idx_inventory_losses_sku ON inventory_losses(seller_sku);
CREATE INDEX idx_inventory_losses_marketplace ON inventory_losses(marketplace) WHERE marketplace IS NOT NULL;
CREATE INDEX idx_inventory_losses_reimbursement ON inventory_losses(reimbursement_status) WHERE reimbursement_status != 'none';
CREATE INDEX idx_inventory_losses_cogs ON inventory_losses(include_in_cogs) WHERE include_in_cogs = true;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER inventory_losses_updated_at
  BEFORE UPDATE ON inventory_losses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create stock ledger entry for losses (debit from inventory)
CREATE OR REPLACE FUNCTION create_loss_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_batch RECORD;
  v_amazon_location_id UUID;
BEGIN
  -- Only create ledger entry if batch is linked
  IF NEW.batch_id IS NOT NULL THEN
    SELECT * INTO v_batch FROM batches WHERE id = NEW.batch_id;

    -- Find Amazon location based on marketplace or default
    SELECT id INTO v_amazon_location_id
    FROM locations
    WHERE type IN ('amazon_fba', 'amazon_awd')
    LIMIT 1;

    IF v_amazon_location_id IS NOT NULL AND v_batch.id IS NOT NULL THEN
      INSERT INTO stock_ledger_entries (
        batch_id, sku, product_name, location_id, quantity,
        movement_type, unit_cost, reason, notes, created_by
      ) VALUES (
        NEW.batch_id,
        NEW.seller_sku,
        v_batch.product_name,
        v_amazon_location_id,
        -NEW.quantity,  -- Negative = removal
        'adjustment_remove',
        NEW.unit_cost,
        'Inventory loss: ' || NEW.loss_type::TEXT,
        COALESCE(NEW.notes, NEW.description),
        'system'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_loss_ledger_trigger
  AFTER INSERT ON inventory_losses
  FOR EACH ROW
  EXECUTE FUNCTION create_loss_ledger_entry();

-- Auto-populate product_id from batch if not set
CREATE OR REPLACE FUNCTION auto_link_loss_to_product()
RETURNS TRIGGER AS $$
BEGIN
  -- If batch is linked but product is not, get product from batch
  IF NEW.batch_id IS NOT NULL AND NEW.product_id IS NULL THEN
    SELECT product_id INTO NEW.product_id
    FROM batches WHERE id = NEW.batch_id;
  END IF;

  -- If still no product, try to find via SKU mapping
  IF NEW.product_id IS NULL THEN
    SELECT internal_product_id INTO NEW.product_id
    FROM amazon_sku_mappings
    WHERE amazon_seller_sku = NEW.seller_sku
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_loss_auto_link
  BEFORE INSERT ON inventory_losses
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_loss_to_product();

-- Update reimbursement status based on amount
CREATE OR REPLACE FUNCTION update_reimbursement_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reimbursement_amount IS NOT NULL AND NEW.reimbursement_amount > 0 THEN
    IF NEW.reimbursement_amount >= (NEW.quantity * NEW.unit_cost) THEN
      NEW.reimbursement_status := 'complete';
    ELSE
      NEW.reimbursement_status := 'partial';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_loss_reimbursement_status
  BEFORE INSERT OR UPDATE OF reimbursement_amount ON inventory_losses
  FOR EACH ROW
  EXECUTE FUNCTION update_reimbursement_status();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Loss summary by type and period
CREATE VIEW inventory_loss_summary AS
SELECT
  DATE_TRUNC('month', loss_date) AS month,
  loss_type,
  marketplace,
  COUNT(*) AS loss_count,
  SUM(quantity) AS total_units,
  SUM(total_cost) AS total_cost,
  SUM(COALESCE(reimbursement_amount, 0)) AS total_reimbursed,
  SUM(net_loss) AS total_net_loss,
  COUNT(*) FILTER (WHERE reimbursement_status = 'pending') AS pending_reimbursements
FROM inventory_losses
GROUP BY
  DATE_TRUNC('month', loss_date),
  loss_type,
  marketplace;

-- Losses by product
CREATE VIEW inventory_losses_by_product AS
SELECT
  DATE_TRUNC('month', loss_date) AS month,
  product_id,
  p.name AS product_name,
  seller_sku,
  SUM(quantity) AS total_units_lost,
  SUM(total_cost) AS total_cost,
  SUM(COALESCE(reimbursement_amount, 0)) AS total_reimbursed,
  SUM(net_loss) AS total_net_loss
FROM inventory_losses il
LEFT JOIN products p ON p.id = il.product_id
WHERE include_in_cogs = true
GROUP BY
  DATE_TRUNC('month', loss_date),
  product_id,
  p.name,
  seller_sku;

-- Losses by batch (for FIFO)
CREATE VIEW inventory_losses_by_batch AS
SELECT
  il.batch_id,
  b.batch_number,
  b.sku,
  SUM(il.quantity) AS total_units_lost,
  SUM(il.total_cost) AS total_cost,
  SUM(COALESCE(il.reimbursement_amount, 0)) AS total_reimbursed,
  SUM(il.net_loss) AS total_net_loss,
  MIN(il.loss_date) AS first_loss_date,
  MAX(il.loss_date) AS last_loss_date
FROM inventory_losses il
LEFT JOIN batches b ON b.id = il.batch_id
WHERE il.batch_id IS NOT NULL
  AND il.include_in_cogs = true
GROUP BY
  il.batch_id,
  b.batch_number,
  b.sku;

-- Pending reimbursements
CREATE VIEW pending_reimbursements AS
SELECT
  il.*,
  p.name AS product_name,
  b.batch_number
FROM inventory_losses il
LEFT JOIN products p ON p.id = il.product_id
LEFT JOIN batches b ON b.id = il.batch_id
WHERE reimbursement_status IN ('pending', 'partial')
ORDER BY loss_date ASC;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE inventory_losses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory_losses"
  ON inventory_losses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert inventory_losses"
  ON inventory_losses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory_losses"
  ON inventory_losses FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete inventory_losses"
  ON inventory_losses FOR DELETE TO authenticated USING (true);
