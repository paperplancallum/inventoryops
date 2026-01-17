-- Amazon Integration Migration
-- Tables for Amazon SP-API connection, inventory sync, SKU mapping, and reconciliation

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Amazon marketplace (North America)
CREATE TYPE amazon_marketplace AS ENUM ('US', 'CA', 'MX');

-- Amazon SKU mapping status
CREATE TYPE amazon_mapping_status AS ENUM ('mapped', 'unmapped', 'pending');

-- Amazon connection status
CREATE TYPE amazon_connection_status AS ENUM ('pending', 'active', 'expired', 'revoked');

-- Amazon item condition
CREATE TYPE amazon_condition AS ENUM (
  'New',
  'Refurbished',
  'UsedLikeNew',
  'UsedVeryGood',
  'UsedGood',
  'UsedAcceptable'
);

-- Reconciliation status
CREATE TYPE reconciliation_status AS ENUM ('matched', 'discrepancy');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Amazon connections: OAuth credentials and connection status
CREATE TABLE amazon_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Seller info
  seller_id TEXT NOT NULL UNIQUE,
  seller_name TEXT,

  -- OAuth tokens (should be encrypted in production)
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  access_token_expires_at TIMESTAMPTZ,

  -- LWA credentials
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,

  -- Enabled marketplaces
  marketplaces amazon_marketplace[] NOT NULL DEFAULT '{US}',

  -- Status
  status amazon_connection_status NOT NULL DEFAULT 'pending',

  -- Sync tracking
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Amazon inventory: Synced inventory from SP-API
CREATE TABLE amazon_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Amazon identifiers
  asin TEXT NOT NULL,
  fnsku TEXT,
  seller_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,

  -- Condition and marketplace
  condition amazon_condition NOT NULL DEFAULT 'New',
  marketplace amazon_marketplace NOT NULL,

  -- FBA quantities
  fba_fulfillable INT NOT NULL DEFAULT 0,
  fba_reserved INT NOT NULL DEFAULT 0,
  fba_inbound_working INT NOT NULL DEFAULT 0,
  fba_inbound_shipped INT NOT NULL DEFAULT 0,
  fba_inbound_receiving INT NOT NULL DEFAULT 0,
  fba_unfulfillable INT NOT NULL DEFAULT 0,

  -- AWD quantities (Amazon Warehousing & Distribution)
  awd_quantity INT NOT NULL DEFAULT 0,
  awd_inbound_quantity INT NOT NULL DEFAULT 0,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique per seller_sku + marketplace
  UNIQUE(seller_sku, marketplace)
);

-- Amazon SKU mappings: Link Amazon SKUs to internal catalog
CREATE TABLE amazon_sku_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Amazon identifiers
  amazon_seller_sku TEXT NOT NULL UNIQUE,
  asin TEXT NOT NULL,
  fnsku TEXT,

  -- Internal catalog link
  internal_sku_id UUID REFERENCES product_skus(id) ON DELETE SET NULL,
  internal_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'system'
);

-- Amazon reconciliations: Track discrepancies between internal and Amazon quantities
CREATE TABLE amazon_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to batch (if applicable)
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- SKU info
  sku TEXT NOT NULL,
  product_name TEXT,

  -- Quantities
  expected_quantity INT NOT NULL,
  amazon_quantity INT NOT NULL,
  discrepancy INT NOT NULL GENERATED ALWAYS AS (amazon_quantity - expected_quantity) STORED,

  -- Status
  status reconciliation_status NOT NULL,

  -- Resolution
  reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled_by TEXT,
  notes TEXT,

  -- Link to adjustment entry (if created)
  adjustment_ledger_entry_id UUID REFERENCES stock_ledger_entries(id) ON DELETE SET NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Amazon connections
CREATE INDEX idx_amazon_connections_seller ON amazon_connections(seller_id);
CREATE INDEX idx_amazon_connections_status ON amazon_connections(status);

-- Amazon inventory
CREATE INDEX idx_amazon_inventory_asin ON amazon_inventory(asin);
CREATE INDEX idx_amazon_inventory_seller_sku ON amazon_inventory(seller_sku);
CREATE INDEX idx_amazon_inventory_marketplace ON amazon_inventory(marketplace);
CREATE INDEX idx_amazon_inventory_synced ON amazon_inventory(last_synced_at);

-- Amazon SKU mappings
CREATE INDEX idx_amazon_sku_mappings_asin ON amazon_sku_mappings(asin);
CREATE INDEX idx_amazon_sku_mappings_internal_sku ON amazon_sku_mappings(internal_sku_id);
CREATE INDEX idx_amazon_sku_mappings_internal_product ON amazon_sku_mappings(internal_product_id);

-- Amazon reconciliations
CREATE INDEX idx_amazon_reconciliations_batch ON amazon_reconciliations(batch_id);
CREATE INDEX idx_amazon_reconciliations_sku ON amazon_reconciliations(sku);
CREATE INDEX idx_amazon_reconciliations_status ON amazon_reconciliations(status);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at for amazon_connections
CREATE TRIGGER amazon_connections_updated_at
  BEFORE UPDATE ON amazon_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Amazon inventory with mapping status
CREATE VIEW amazon_inventory_with_mapping AS
SELECT
  ai.*,
  CASE
    WHEN asm.id IS NOT NULL THEN 'mapped'::amazon_mapping_status
    ELSE 'unmapped'::amazon_mapping_status
  END AS mapping_status,
  asm.internal_sku_id,
  asm.internal_product_id,
  p.name AS internal_product_name,
  ps.sku AS internal_sku
FROM amazon_inventory ai
LEFT JOIN amazon_sku_mappings asm ON asm.amazon_seller_sku = ai.seller_sku
LEFT JOIN products p ON p.id = asm.internal_product_id
LEFT JOIN product_skus ps ON ps.id = asm.internal_sku_id;

-- Amazon inventory summary (aggregated totals)
CREATE VIEW amazon_inventory_summary AS
SELECT
  SUM(fba_fulfillable) AS fba_fulfillable_total,
  SUM(fba_reserved) AS fba_reserved_total,
  SUM(fba_inbound_working + fba_inbound_shipped + fba_inbound_receiving) AS fba_inbound_total,
  SUM(fba_unfulfillable) AS fba_unfulfillable_total,
  SUM(awd_quantity) AS awd_total,
  SUM(awd_inbound_quantity) AS awd_inbound_total,
  COUNT(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM amazon_sku_mappings asm WHERE asm.amazon_seller_sku = ai.seller_sku
  )) AS unmapped_sku_count,
  MAX(last_synced_at) AS last_synced_at
FROM amazon_inventory ai;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE amazon_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_sku_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_reconciliations ENABLE ROW LEVEL SECURITY;

-- Amazon connections policies (sensitive - restricted access)
CREATE POLICY "Authenticated users can view amazon_connections"
  ON amazon_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_connections"
  ON amazon_connections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_connections"
  ON amazon_connections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete amazon_connections"
  ON amazon_connections FOR DELETE
  TO authenticated
  USING (true);

-- Amazon inventory policies
CREATE POLICY "Authenticated users can view amazon_inventory"
  ON amazon_inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_inventory"
  ON amazon_inventory FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_inventory"
  ON amazon_inventory FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete amazon_inventory"
  ON amazon_inventory FOR DELETE
  TO authenticated
  USING (true);

-- Amazon SKU mappings policies
CREATE POLICY "Authenticated users can view amazon_sku_mappings"
  ON amazon_sku_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_sku_mappings"
  ON amazon_sku_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_sku_mappings"
  ON amazon_sku_mappings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete amazon_sku_mappings"
  ON amazon_sku_mappings FOR DELETE
  TO authenticated
  USING (true);

-- Amazon reconciliations policies
CREATE POLICY "Authenticated users can view amazon_reconciliations"
  ON amazon_reconciliations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert amazon_reconciliations"
  ON amazon_reconciliations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_reconciliations"
  ON amazon_reconciliations FOR UPDATE
  TO authenticated
  USING (true);
