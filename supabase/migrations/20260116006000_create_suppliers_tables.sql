-- Migration: Create Suppliers, Locations, and Payment Terms Templates
-- Enables vendor relationship management

-- ============================================================
-- LOCATION TYPE ENUM
-- ============================================================

CREATE TYPE location_type AS ENUM (
  'factory',
  'warehouse',
  '3pl',
  'amazon_fba',
  'amazon_awd',
  'port',
  'customs'
);

-- ============================================================
-- LOCATIONS TABLE (Factory type for now, expandable later)
-- ============================================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type location_type NOT NULL,
  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(255),
  state_province VARCHAR(255),
  postal_code VARCHAR(50),
  country VARCHAR(100) NOT NULL,
  country_code CHAR(2),

  -- Contact info for this location
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_country ON locations(country);
CREATE INDEX idx_locations_active ON locations(is_active) WHERE is_active = true;

-- ============================================================
-- PAYMENT MILESTONE TRIGGER ENUM
-- ============================================================

CREATE TYPE payment_milestone_trigger AS ENUM (
  'po_confirmed',
  'inspection_passed',
  'customs_cleared',
  'shipment_departed',
  'goods_received',
  'manual',
  'upfront'
);

-- ============================================================
-- PAYMENT TERMS TEMPLATES TABLE
-- ============================================================

CREATE TABLE payment_terms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Milestones stored as JSONB array
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPPLIER STATUS ENUM
-- ============================================================

CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'archived');

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,

  -- Contact information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Location
  country VARCHAR(100) NOT NULL,
  country_code CHAR(2),

  -- Business terms
  lead_time_days INTEGER NOT NULL DEFAULT 30,
  payment_terms VARCHAR(255), -- Display string like "30% deposit, 70% before shipping"
  payment_terms_template_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,
  -- Custom milestones override template if provided
  custom_payment_milestones JSONB,

  -- Factory location link
  factory_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Status and notes
  status supplier_status NOT NULL DEFAULT 'active',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_country ON suppliers(country);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_factory ON suppliers(factory_location_id);

-- ============================================================
-- ADD FK FROM PRODUCTS TO SUPPLIERS
-- ============================================================

ALTER TABLE products
  ADD CONSTRAINT products_supplier_fk
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_terms_templates_updated_at
  BEFORE UPDATE ON payment_terms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Locations policies
CREATE POLICY "Authenticated users can view locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payment terms templates policies
CREATE POLICY "Authenticated users can view payment terms templates"
  ON payment_terms_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payment terms templates"
  ON payment_terms_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DATA: PAYMENT TERMS TEMPLATES
-- ============================================================

INSERT INTO payment_terms_templates (id, name, description, milestones) VALUES
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Standard 30/70',
    '30% deposit on PO confirmation, 70% before shipping',
    '[
      {"id": "m1", "name": "Deposit", "percentage": 30, "trigger": "po_confirmed", "offsetDays": 0},
      {"id": "m2", "name": "Balance", "percentage": 70, "trigger": "inspection_passed", "offsetDays": 0}
    ]'::jsonb
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Net 30',
    'Full payment due 30 days after goods received',
    '[
      {"id": "m1", "name": "Full Payment", "percentage": 100, "trigger": "goods_received", "offsetDays": 30}
    ]'::jsonb
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    '50/50 Split',
    '50% deposit, 50% on delivery',
    '[
      {"id": "m1", "name": "Deposit", "percentage": 50, "trigger": "po_confirmed", "offsetDays": 0},
      {"id": "m2", "name": "Balance", "percentage": 50, "trigger": "goods_received", "offsetDays": 0}
    ]'::jsonb
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d482',
    '30/40/30 Split',
    '30% deposit, 40% after inspection, 30% on delivery',
    '[
      {"id": "m1", "name": "Deposit", "percentage": 30, "trigger": "po_confirmed", "offsetDays": 0},
      {"id": "m2", "name": "Post-Inspection", "percentage": 40, "trigger": "inspection_passed", "offsetDays": 0},
      {"id": "m3", "name": "Final", "percentage": 30, "trigger": "goods_received", "offsetDays": 0}
    ]'::jsonb
  ),
  (
    'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    '100% Prepay',
    'Full payment required before production',
    '[
      {"id": "m1", "name": "Full Prepayment", "percentage": 100, "trigger": "upfront", "offsetDays": 0}
    ]'::jsonb
  );
