-- COGS Module: Settings and Configuration
-- User-configurable COGS calculation profiles

-- =============================================================================
-- TABLES
-- =============================================================================

-- COGS Settings: Named profiles for different calculation methods
CREATE TABLE cogs_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Profile identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Product cost (always included, but can adjust)
  include_product_cost BOOLEAN NOT NULL DEFAULT true,

  -- Shipping/Transfer costs
  include_shipping_to_amazon BOOLEAN NOT NULL DEFAULT true,  -- Transfer costs
  include_duties_taxes BOOLEAN NOT NULL DEFAULT true,

  -- FBA fees
  include_fba_fulfillment BOOLEAN NOT NULL DEFAULT false,  -- Per-unit fulfillment
  include_fba_storage BOOLEAN NOT NULL DEFAULT false,       -- Monthly storage

  -- FBA prep/handling
  include_fba_prep BOOLEAN NOT NULL DEFAULT false,
  include_fba_labeling BOOLEAN NOT NULL DEFAULT false,

  -- Inbound fees
  include_inbound_placement BOOLEAN NOT NULL DEFAULT true,
  include_inbound_transportation BOOLEAN NOT NULL DEFAULT true,

  -- AWD fees
  include_awd_storage BOOLEAN NOT NULL DEFAULT false,
  include_awd_processing BOOLEAN NOT NULL DEFAULT false,
  include_awd_transportation BOOLEAN NOT NULL DEFAULT false,

  -- Other Amazon fees
  include_referral_fees BOOLEAN NOT NULL DEFAULT false,     -- Usually separate from COGS
  include_advertising BOOLEAN NOT NULL DEFAULT false,       -- Usually separate from COGS

  -- Inventory adjustments
  include_damaged_lost BOOLEAN NOT NULL DEFAULT true,
  include_disposed BOOLEAN NOT NULL DEFAULT true,

  -- Assembly/Work order costs
  include_assembly_costs BOOLEAN NOT NULL DEFAULT true,

  -- JSON for custom/future fee types
  custom_inclusions JSONB DEFAULT '{}',

  -- Export format preferences
  export_format TEXT DEFAULT 'csv',  -- 'csv', 'json', 'xlsx'
  export_decimal_places INT DEFAULT 2,
  export_include_headers BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_cogs_settings_name ON cogs_settings(name);
CREATE INDEX idx_cogs_settings_default ON cogs_settings(is_default) WHERE is_default = true;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER cogs_settings_updated_at
  BEFORE UPDATE ON cogs_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one default profile
CREATE OR REPLACE FUNCTION ensure_single_default_cogs_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE cogs_settings
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cogs_settings_single_default
  BEFORE INSERT OR UPDATE OF is_default ON cogs_settings
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_cogs_profile();

-- =============================================================================
-- DEFAULT PROFILES
-- =============================================================================

-- Default profile: Full landed cost
INSERT INTO cogs_settings (
  name, description, is_default,
  include_product_cost, include_shipping_to_amazon, include_duties_taxes,
  include_fba_fulfillment, include_fba_storage,
  include_inbound_placement, include_inbound_transportation,
  include_damaged_lost, include_disposed, include_assembly_costs
) VALUES (
  'default', 'Full landed cost including all direct costs', true,
  true, true, true,
  false, false,
  true, true,
  true, true, true
);

-- SellerBoard profile: Landed cost without Amazon fees (SellerBoard calculates those)
INSERT INTO cogs_settings (
  name, description, is_default,
  include_product_cost, include_shipping_to_amazon, include_duties_taxes,
  include_fba_fulfillment, include_fba_storage,
  include_inbound_placement, include_inbound_transportation,
  include_awd_storage, include_awd_processing, include_awd_transportation,
  include_damaged_lost, include_disposed, include_assembly_costs
) VALUES (
  'sellerboard', 'Landed COGS for SellerBoard (excludes Amazon fees they track)', false,
  true, true, true,
  false, false,
  false, false,
  false, false, false,
  true, true, true
);

-- Full COGS profile: Include all costs
INSERT INTO cogs_settings (
  name, description, is_default,
  include_product_cost, include_shipping_to_amazon, include_duties_taxes,
  include_fba_fulfillment, include_fba_storage,
  include_fba_prep, include_fba_labeling,
  include_inbound_placement, include_inbound_transportation,
  include_awd_storage, include_awd_processing, include_awd_transportation,
  include_damaged_lost, include_disposed, include_assembly_costs
) VALUES (
  'full', 'Full COGS including all Amazon fees', false,
  true, true, true,
  true, true,
  true, true,
  true, true,
  true, true, true,
  true, true, true
);

-- QuickBooks profile: Simple cost tracking
INSERT INTO cogs_settings (
  name, description, is_default,
  include_product_cost, include_shipping_to_amazon, include_duties_taxes,
  include_fba_fulfillment, include_fba_storage,
  include_inbound_placement, include_inbound_transportation,
  include_damaged_lost, include_disposed, include_assembly_costs
) VALUES (
  'quickbooks', 'Simple COGS for QuickBooks export', false,
  true, true, true,
  false, false,
  false, false,
  true, true, true
);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active COGS settings for quick lookup
CREATE VIEW active_cogs_settings AS
SELECT *
FROM cogs_settings
WHERE is_default = true
LIMIT 1;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Get settings by name (or default)
CREATE OR REPLACE FUNCTION get_cogs_settings(p_name TEXT DEFAULT NULL)
RETURNS cogs_settings AS $$
DECLARE
  v_settings cogs_settings;
BEGIN
  IF p_name IS NOT NULL THEN
    SELECT * INTO v_settings FROM cogs_settings WHERE name = p_name;
    IF FOUND THEN
      RETURN v_settings;
    END IF;
  END IF;

  -- Fall back to default
  SELECT * INTO v_settings FROM cogs_settings WHERE is_default = true LIMIT 1;
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE cogs_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cogs_settings"
  ON cogs_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cogs_settings"
  ON cogs_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update cogs_settings"
  ON cogs_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete cogs_settings"
  ON cogs_settings FOR DELETE TO authenticated USING (true);
