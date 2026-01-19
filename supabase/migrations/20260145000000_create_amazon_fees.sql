-- COGS Module: Amazon Fee Tracking
-- Tables for tracking Amazon fees and their allocation to products/batches

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

CREATE TYPE amazon_fee_type AS ENUM (
  -- FBA fees
  'fba_fulfillment',
  'fba_storage_monthly',
  'fba_storage_long_term',
  'fba_removal',
  'fba_disposal',
  'fba_prep',
  'fba_labeling',

  -- Inbound fees
  'inbound_placement',
  'inbound_defect',
  'inbound_transportation',

  -- AWD fees
  'awd_storage',
  'awd_processing',
  'awd_transportation',

  -- Referral/commission
  'referral_fee',

  -- Advertising
  'sponsored_products',
  'sponsored_brands',
  'sponsored_display',

  -- Adjustments
  'reimbursement',
  'refund_admin',

  -- Other
  'other'
);

CREATE TYPE fee_attribution_level AS ENUM (
  'order_item',    -- Directly linked to a specific sale
  'shipment',      -- Inbound shipment (attribute to batches)
  'product',       -- Product-level aggregate (monthly storage, etc.)
  'account'        -- Account-level (prorate by sales volume)
);

CREATE TYPE fee_allocation_method AS ENUM (
  'direct',              -- 100% to single target
  'prorate_quantity',    -- Split by quantity (units held/sold)
  'prorate_value'        -- Split by inventory value
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Amazon Fees: All fees from Amazon
CREATE TABLE amazon_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Fee details
  fee_type amazon_fee_type NOT NULL,
  description TEXT,

  -- Amount (converted to USD for consistency)
  amount DECIMAL(12, 2) NOT NULL,  -- Positive = cost, Negative = reimbursement
  original_currency TEXT NOT NULL DEFAULT 'USD',
  original_amount DECIMAL(12, 2),
  exchange_rate_to_usd DECIMAL(10, 6) NOT NULL DEFAULT 1.0,

  -- Attribution level
  attribution_level fee_attribution_level NOT NULL,

  -- Direct links (depending on attribution level)
  order_id UUID REFERENCES amazon_orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES amazon_order_items(id) ON DELETE SET NULL,
  amazon_shipment_id UUID REFERENCES amazon_shipments(id) ON DELETE SET NULL,
  internal_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Date
  fee_date DATE NOT NULL,
  period_start DATE,  -- For storage fees: period covered
  period_end DATE,

  -- Marketplace
  marketplace amazon_marketplace,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual', 'sp-api', 'import'
  source_reference TEXT,  -- External reference ID (e.g., transaction ID)

  -- COGS toggle (per fee instance, allows overriding global settings)
  include_in_cogs BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Amazon Fee Allocations: How fees are distributed to products/batches
-- Used for account-level and product-level fees that need proration
CREATE TABLE amazon_fee_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  fee_id UUID NOT NULL REFERENCES amazon_fees(id) ON DELETE CASCADE,

  -- Allocation target (one of these should be set)
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES amazon_order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Allocated amount
  allocated_amount DECIMAL(12, 2) NOT NULL,
  allocation_method fee_allocation_method NOT NULL,

  -- Allocation basis (for audit)
  allocation_basis_quantity INT,  -- Units used for calculation
  allocation_basis_value DECIMAL(12, 2),  -- Value used for calculation
  allocation_percentage DECIMAL(8, 4),  -- % of fee allocated

  -- Period (for monthly reporting)
  allocation_month DATE NOT NULL,  -- First day of month

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_amazon_fees_type ON amazon_fees(fee_type);
CREATE INDEX idx_amazon_fees_date ON amazon_fees(fee_date);
CREATE INDEX idx_amazon_fees_period ON amazon_fees(period_start, period_end);
CREATE INDEX idx_amazon_fees_attribution ON amazon_fees(attribution_level);
CREATE INDEX idx_amazon_fees_marketplace ON amazon_fees(marketplace);
CREATE INDEX idx_amazon_fees_include_cogs ON amazon_fees(include_in_cogs) WHERE include_in_cogs = true;

-- Direct link indexes
CREATE INDEX idx_amazon_fees_order ON amazon_fees(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_amazon_fees_order_item ON amazon_fees(order_item_id) WHERE order_item_id IS NOT NULL;
CREATE INDEX idx_amazon_fees_shipment ON amazon_fees(amazon_shipment_id) WHERE amazon_shipment_id IS NOT NULL;
CREATE INDEX idx_amazon_fees_product ON amazon_fees(internal_product_id) WHERE internal_product_id IS NOT NULL;
CREATE INDEX idx_amazon_fees_batch ON amazon_fees(batch_id) WHERE batch_id IS NOT NULL;

-- Fee allocations indexes
CREATE INDEX idx_fee_allocations_fee ON amazon_fee_allocations(fee_id);
CREATE INDEX idx_fee_allocations_batch ON amazon_fee_allocations(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_fee_allocations_product ON amazon_fee_allocations(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_fee_allocations_order_item ON amazon_fee_allocations(order_item_id) WHERE order_item_id IS NOT NULL;
CREATE INDEX idx_fee_allocations_month ON amazon_fee_allocations(allocation_month);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER amazon_fees_updated_at
  BEFORE UPDATE ON amazon_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create allocation for direct (non-prorated) fees
CREATE OR REPLACE FUNCTION auto_create_direct_fee_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for direct attribution types that have a specific target
  IF NEW.attribution_level = 'order_item' AND NEW.order_item_id IS NOT NULL THEN
    INSERT INTO amazon_fee_allocations (
      fee_id, order_item_id, allocated_amount, allocation_method,
      allocation_percentage, allocation_month
    ) VALUES (
      NEW.id, NEW.order_item_id, NEW.amount, 'direct',
      100.0, DATE_TRUNC('month', NEW.fee_date)
    );
  ELSIF NEW.attribution_level = 'shipment' AND NEW.batch_id IS NOT NULL THEN
    INSERT INTO amazon_fee_allocations (
      fee_id, batch_id, allocated_amount, allocation_method,
      allocation_percentage, allocation_month
    ) VALUES (
      NEW.id, NEW.batch_id, NEW.amount, 'direct',
      100.0, DATE_TRUNC('month', NEW.fee_date)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER amazon_fees_auto_allocate
  AFTER INSERT ON amazon_fees
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_direct_fee_allocation();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Fee summary by type and period
CREATE VIEW amazon_fees_summary AS
SELECT
  DATE_TRUNC('month', fee_date) AS month,
  fee_type,
  marketplace,
  attribution_level,
  COUNT(*) AS fee_count,
  SUM(amount) AS total_amount,
  SUM(amount) FILTER (WHERE include_in_cogs = true) AS cogs_amount,
  SUM(amount) FILTER (WHERE amount > 0) AS total_charges,
  SUM(ABS(amount)) FILTER (WHERE amount < 0) AS total_reimbursements
FROM amazon_fees
GROUP BY
  DATE_TRUNC('month', fee_date),
  fee_type,
  marketplace,
  attribution_level;

-- Fees by product (aggregated allocations)
CREATE VIEW amazon_fees_by_product AS
SELECT
  afa.allocation_month AS month,
  afa.product_id,
  p.name AS product_name,
  p.sku,
  af.fee_type,
  SUM(afa.allocated_amount) AS total_allocated
FROM amazon_fee_allocations afa
JOIN amazon_fees af ON af.id = afa.fee_id
LEFT JOIN products p ON p.id = afa.product_id
WHERE afa.product_id IS NOT NULL
  AND af.include_in_cogs = true
GROUP BY
  afa.allocation_month,
  afa.product_id,
  p.name,
  p.sku,
  af.fee_type;

-- Fees by batch (for FIFO reporting)
CREATE VIEW amazon_fees_by_batch AS
SELECT
  afa.batch_id,
  b.batch_number,
  b.sku,
  af.fee_type,
  SUM(afa.allocated_amount) AS total_allocated,
  MIN(af.fee_date) AS first_fee_date,
  MAX(af.fee_date) AS last_fee_date
FROM amazon_fee_allocations afa
JOIN amazon_fees af ON af.id = afa.fee_id
LEFT JOIN batches b ON b.id = afa.batch_id
WHERE afa.batch_id IS NOT NULL
  AND af.include_in_cogs = true
GROUP BY
  afa.batch_id,
  b.batch_number,
  b.sku,
  af.fee_type;

-- Unallocated fees (need manual allocation)
CREATE VIEW unallocated_amazon_fees AS
SELECT
  af.*
FROM amazon_fees af
WHERE af.attribution_level IN ('product', 'account')
  AND NOT EXISTS (
    SELECT 1 FROM amazon_fee_allocations afa WHERE afa.fee_id = af.id
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Allocate a product-level fee by units held in period
CREATE OR REPLACE FUNCTION allocate_fee_by_inventory(
  p_fee_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS INT AS $$
DECLARE
  v_fee RECORD;
  v_total_units INT;
  v_allocation RECORD;
  v_allocated_count INT := 0;
BEGIN
  -- Get fee details
  SELECT * INTO v_fee FROM amazon_fees WHERE id = p_fee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee not found: %', p_fee_id;
  END IF;

  -- Get total units in Amazon inventory for the period
  SELECT SUM(fba_fulfillable + fba_reserved + awd_quantity) INTO v_total_units
  FROM amazon_inventory;

  IF v_total_units IS NULL OR v_total_units = 0 THEN
    RETURN 0;
  END IF;

  -- Allocate to each product proportionally
  FOR v_allocation IN
    SELECT
      asm.internal_product_id AS product_id,
      SUM(ai.fba_fulfillable + ai.fba_reserved + ai.awd_quantity) AS units
    FROM amazon_inventory ai
    JOIN amazon_sku_mappings asm ON asm.amazon_seller_sku = ai.seller_sku
    WHERE asm.internal_product_id IS NOT NULL
    GROUP BY asm.internal_product_id
    HAVING SUM(ai.fba_fulfillable + ai.fba_reserved + ai.awd_quantity) > 0
  LOOP
    INSERT INTO amazon_fee_allocations (
      fee_id, product_id, allocated_amount, allocation_method,
      allocation_basis_quantity, allocation_percentage, allocation_month
    ) VALUES (
      p_fee_id,
      v_allocation.product_id,
      v_fee.amount * (v_allocation.units::DECIMAL / v_total_units),
      'prorate_quantity',
      v_allocation.units,
      (v_allocation.units::DECIMAL / v_total_units) * 100,
      DATE_TRUNC('month', v_fee.fee_date)
    );

    v_allocated_count := v_allocated_count + 1;
  END LOOP;

  RETURN v_allocated_count;
END;
$$ LANGUAGE plpgsql;

-- Allocate a fulfillment fee by units sold in period
CREATE OR REPLACE FUNCTION allocate_fee_by_sales(
  p_fee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INT AS $$
DECLARE
  v_fee RECORD;
  v_total_units INT;
  v_allocation RECORD;
  v_allocated_count INT := 0;
BEGIN
  -- Get fee details
  SELECT * INTO v_fee FROM amazon_fees WHERE id = p_fee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee not found: %', p_fee_id;
  END IF;

  -- Get total units sold in period
  SELECT SUM(aoi.quantity_shipped) INTO v_total_units
  FROM amazon_order_items aoi
  JOIN amazon_orders ao ON ao.id = aoi.order_id
  WHERE ao.ship_date >= p_start_date
    AND ao.ship_date <= p_end_date
    AND ao.status IN ('shipped', 'delivered');

  IF v_total_units IS NULL OR v_total_units = 0 THEN
    RETURN 0;
  END IF;

  -- Allocate to each product proportionally
  FOR v_allocation IN
    SELECT
      aoi.internal_product_id AS product_id,
      SUM(aoi.quantity_shipped) AS units
    FROM amazon_order_items aoi
    JOIN amazon_orders ao ON ao.id = aoi.order_id
    WHERE ao.ship_date >= p_start_date
      AND ao.ship_date <= p_end_date
      AND ao.status IN ('shipped', 'delivered')
      AND aoi.internal_product_id IS NOT NULL
    GROUP BY aoi.internal_product_id
    HAVING SUM(aoi.quantity_shipped) > 0
  LOOP
    INSERT INTO amazon_fee_allocations (
      fee_id, product_id, allocated_amount, allocation_method,
      allocation_basis_quantity, allocation_percentage, allocation_month
    ) VALUES (
      p_fee_id,
      v_allocation.product_id,
      v_fee.amount * (v_allocation.units::DECIMAL / v_total_units),
      'prorate_quantity',
      v_allocation.units,
      (v_allocation.units::DECIMAL / v_total_units) * 100,
      DATE_TRUNC('month', v_fee.fee_date)
    );

    v_allocated_count := v_allocated_count + 1;
  END LOOP;

  RETURN v_allocated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE amazon_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_fee_allocations ENABLE ROW LEVEL SECURITY;

-- Amazon fees policies
CREATE POLICY "Authenticated users can view amazon_fees"
  ON amazon_fees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert amazon_fees"
  ON amazon_fees FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_fees"
  ON amazon_fees FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete amazon_fees"
  ON amazon_fees FOR DELETE TO authenticated USING (true);

-- Amazon fee allocations policies
CREATE POLICY "Authenticated users can view amazon_fee_allocations"
  ON amazon_fee_allocations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert amazon_fee_allocations"
  ON amazon_fee_allocations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_fee_allocations"
  ON amazon_fee_allocations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete amazon_fee_allocations"
  ON amazon_fee_allocations FOR DELETE TO authenticated USING (true);
