-- Amazon Settlement Reports Migration
-- Tables for storing settlement reports and transaction-level data from Amazon SP-API
-- This enables A2X-like functionality for financial reconciliation

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Settlement processing status
CREATE TYPE amazon_settlement_status AS ENUM (
  'pending',      -- Report requested, not yet downloaded
  'processing',   -- Report being parsed
  'completed',    -- Successfully processed
  'failed',       -- Processing failed
  'reconciled'    -- Manually reconciled by user
);

-- Transaction types from settlement report
CREATE TYPE amazon_transaction_type AS ENUM (
  'Order',
  'Refund',
  'ServiceFee',
  'Adjustment',
  'Transfer',
  'FBAInventoryFee',
  'FBACustomerReturn',
  'Chargeback',
  'ChargebackRefund',
  'GuaranteeClaim',
  'SAFE-TReimbursement',
  'Other'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Amazon settlements: Summary of each settlement period/deposit
CREATE TABLE amazon_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Amazon identifiers
  settlement_id TEXT NOT NULL UNIQUE,
  report_id TEXT,                        -- Amazon report ID for reference

  -- Settlement period
  settlement_start_date TIMESTAMPTZ NOT NULL,
  settlement_end_date TIMESTAMPTZ NOT NULL,
  deposit_date TIMESTAMPTZ,

  -- Financial summary
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  marketplace TEXT NOT NULL DEFAULT 'US',

  -- Computed aggregates (updated after parsing)
  total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_refunds DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_other DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Transaction counts
  order_count INT NOT NULL DEFAULT 0,
  refund_count INT NOT NULL DEFAULT 0,

  -- Processing status
  status amazon_settlement_status NOT NULL DEFAULT 'pending',
  error_message TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Amazon settlement transactions: Line-item detail from settlement report
CREATE TABLE amazon_settlement_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent settlement
  settlement_id UUID NOT NULL REFERENCES amazon_settlements(id) ON DELETE CASCADE,

  -- Amazon identifiers
  order_id TEXT,
  merchant_order_id TEXT,
  adjustment_id TEXT,
  shipment_id TEXT,

  -- Product info
  sku TEXT,
  product_name TEXT,
  quantity INT,

  -- Transaction categorization
  transaction_type amazon_transaction_type NOT NULL,
  amount_type TEXT NOT NULL,              -- e.g., 'ItemPrice', 'ItemFees', 'Promotion'
  amount_description TEXT,                -- e.g., 'Principal', 'FBAPerUnitFulfillmentFee'

  -- Financial
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Timing
  posted_date TIMESTAMPTZ,
  posted_date_time TIMESTAMPTZ,

  -- For linking to internal inventory (optional)
  internal_sku_id UUID,
  internal_product_id UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Settlements
CREATE INDEX idx_amazon_settlements_settlement_id ON amazon_settlements(settlement_id);
CREATE INDEX idx_amazon_settlements_status ON amazon_settlements(status);
CREATE INDEX idx_amazon_settlements_dates ON amazon_settlements(settlement_start_date, settlement_end_date);
CREATE INDEX idx_amazon_settlements_deposit ON amazon_settlements(deposit_date);
CREATE INDEX idx_amazon_settlements_marketplace ON amazon_settlements(marketplace);

-- Transactions
CREATE INDEX idx_amazon_settlement_txns_settlement ON amazon_settlement_transactions(settlement_id);
CREATE INDEX idx_amazon_settlement_txns_order ON amazon_settlement_transactions(order_id);
CREATE INDEX idx_amazon_settlement_txns_sku ON amazon_settlement_transactions(sku);
CREATE INDEX idx_amazon_settlement_txns_type ON amazon_settlement_transactions(transaction_type);
CREATE INDEX idx_amazon_settlement_txns_amount_type ON amazon_settlement_transactions(amount_type);
CREATE INDEX idx_amazon_settlement_txns_posted ON amazon_settlement_transactions(posted_date);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at for settlements
CREATE TRIGGER amazon_settlements_updated_at
  BEFORE UPDATE ON amazon_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Settlement summary with aggregated transaction data
CREATE VIEW amazon_settlement_summary AS
SELECT
  s.id,
  s.settlement_id,
  s.settlement_start_date,
  s.settlement_end_date,
  s.deposit_date,
  s.total_amount,
  s.currency,
  s.marketplace,
  s.status,
  s.total_sales,
  s.total_refunds,
  s.total_fees,
  s.total_other,
  s.order_count,
  s.refund_count,
  s.created_at,
  s.processed_at,
  -- Calculate net from components
  (s.total_sales + s.total_refunds + s.total_fees + s.total_other) AS calculated_net
FROM amazon_settlements s;

-- Transaction breakdown by type for each settlement
CREATE VIEW amazon_settlement_breakdown AS
SELECT
  settlement_id,
  transaction_type,
  amount_type,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount,
  SUM(CASE WHEN quantity IS NOT NULL THEN quantity ELSE 0 END) AS total_units
FROM amazon_settlement_transactions
GROUP BY settlement_id, transaction_type, amount_type
ORDER BY settlement_id, transaction_type, total_amount DESC;

-- Fee breakdown view (for fee analysis)
CREATE VIEW amazon_fee_breakdown AS
SELECT
  s.id AS settlement_id,
  s.settlement_id AS amazon_settlement_id,
  s.settlement_start_date,
  s.settlement_end_date,
  t.amount_description AS fee_type,
  COUNT(*) AS occurrence_count,
  SUM(t.amount) AS total_amount,
  AVG(t.amount) AS avg_amount
FROM amazon_settlements s
JOIN amazon_settlement_transactions t ON t.settlement_id = s.id
WHERE t.amount_type IN ('ItemFees', 'FBAFees', 'Commission', 'ShippingChargeback', 'Other')
   OR t.transaction_type IN ('ServiceFee', 'FBAInventoryFee')
GROUP BY s.id, s.settlement_id, s.settlement_start_date, s.settlement_end_date, t.amount_description
ORDER BY total_amount ASC; -- Fees are negative, so ascending shows biggest fees first

-- SKU-level profitability from settlements
CREATE VIEW amazon_sku_settlement_summary AS
SELECT
  t.sku,
  t.product_name,
  s.settlement_id AS amazon_settlement_id,
  s.settlement_start_date,
  s.settlement_end_date,
  SUM(CASE WHEN t.amount_type = 'ItemPrice' AND t.amount_description = 'Principal' THEN t.amount ELSE 0 END) AS product_sales,
  SUM(CASE WHEN t.amount_type = 'ItemPrice' AND t.amount_description = 'Shipping' THEN t.amount ELSE 0 END) AS shipping_credits,
  SUM(CASE WHEN t.amount_type = 'Promotion' THEN t.amount ELSE 0 END) AS promotions,
  SUM(CASE WHEN t.amount_type IN ('ItemFees', 'FBAFees', 'Commission') THEN t.amount ELSE 0 END) AS fees,
  SUM(CASE WHEN t.transaction_type = 'Refund' THEN t.amount ELSE 0 END) AS refunds,
  SUM(t.amount) AS net_proceeds,
  SUM(CASE WHEN t.quantity IS NOT NULL THEN t.quantity ELSE 0 END) AS units
FROM amazon_settlement_transactions t
JOIN amazon_settlements s ON s.id = t.settlement_id
WHERE t.sku IS NOT NULL
GROUP BY t.sku, t.product_name, s.settlement_id, s.settlement_start_date, s.settlement_end_date
ORDER BY net_proceeds DESC;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE amazon_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_settlement_transactions ENABLE ROW LEVEL SECURITY;

-- Settlements policies
CREATE POLICY "Authenticated users can view amazon_settlements"
  ON amazon_settlements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_settlements"
  ON amazon_settlements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_settlements"
  ON amazon_settlements FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete amazon_settlements"
  ON amazon_settlements FOR DELETE
  TO authenticated
  USING (true);

-- Transactions policies
CREATE POLICY "Authenticated users can view amazon_settlement_transactions"
  ON amazon_settlement_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_settlement_transactions"
  ON amazon_settlement_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_settlement_transactions"
  ON amazon_settlement_transactions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete amazon_settlement_transactions"
  ON amazon_settlement_transactions FOR DELETE
  TO authenticated
  USING (true);
