-- Migration: Create Bill of Materials (BOM) System
-- Adds product types, BOM tables, and extends existing enums

-- ============================================================================
-- SECTION 1: New Enums
-- ============================================================================

-- Product type to distinguish components from finished goods
CREATE TYPE product_type AS ENUM ('simple', 'component', 'finished_good');

-- Work order status lifecycle
CREATE TYPE work_order_status AS ENUM (
  'draft',
  'planned',
  'in_progress',
  'completed',
  'cancelled'
);

-- Work order cost types for fee tracking
CREATE TYPE work_order_cost_type AS ENUM (
  'kitting_per_unit',
  'kitting_flat',
  'assembly_per_unit',
  'assembly_flat',
  'packaging',
  'labor',
  'other'
);

-- ============================================================================
-- SECTION 2: Extend Existing Enums
-- ============================================================================

-- Add assembly movement types to stock_movement_type
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'assembly_consumption';
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'assembly_output';
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'batch_split_out';
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'batch_split_in';

-- Add work-order as a linked entity type for invoices
ALTER TYPE linked_entity_type ADD VALUE IF NOT EXISTS 'work-order';

-- Add assembly as an invoice type
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'assembly';

-- Add BOM and work_order to activity entity types
ALTER TYPE activity_entity_type ADD VALUE IF NOT EXISTS 'bom';
ALTER TYPE activity_entity_type ADD VALUE IF NOT EXISTS 'work_order';

-- ============================================================================
-- SECTION 3: Modify Products Table
-- ============================================================================

-- Add product_type column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type product_type NOT NULL DEFAULT 'simple';

-- Index for filtering by product type
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

-- ============================================================================
-- SECTION 4: BOM Tables
-- ============================================================================

-- Sequence for BOM versioning
CREATE SEQUENCE IF NOT EXISTS bom_number_seq START 1;

-- BOMs: Defines a finished good and its component structure
CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The finished good product this BOM produces
  finished_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- BOM metadata
  name TEXT NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Standard output quantity (typically 1, but could be a batch like 100)
  output_quantity INT NOT NULL DEFAULT 1 CHECK (output_quantity > 0),

  -- Expected scrap/waste percentage (for planning)
  expected_scrap_percent DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (expected_scrap_percent >= 0 AND expected_scrap_percent < 100),

  -- Audit
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOM Line Items: Components required for the finished good
CREATE TABLE IF NOT EXISTS bom_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,

  -- Component product (should be type 'component' but not enforced at DB level)
  component_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantity required per output_quantity of finished good
  quantity_required DECIMAL(10, 4) NOT NULL CHECK (quantity_required > 0),

  -- Unit of measure (for future UOM support)
  uom TEXT NOT NULL DEFAULT 'each',

  -- Position indicator (e.g., "inner sleeve", "outer box")
  position_notes TEXT,

  -- Sort order for display
  sort_order INT NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOM History: Track changes to BOMs for audit
CREATE TABLE IF NOT EXISTS bom_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  change_description TEXT NOT NULL,
  line_items_snapshot JSONB NOT NULL,
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: BOM Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_boms_finished_product ON boms(finished_product_id);
CREATE INDEX IF NOT EXISTS idx_boms_active ON boms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bom_line_items_bom ON bom_line_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_line_items_component ON bom_line_items(component_product_id);
CREATE INDEX IF NOT EXISTS idx_bom_history_bom ON bom_history(bom_id);

-- ============================================================================
-- SECTION 6: BOM Triggers
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER boms_updated_at
  BEFORE UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bom_line_items_updated_at
  BEFORE UPDATE ON bom_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: BOM Functions
-- ============================================================================

-- Function to create a new BOM version (archives old, creates new)
CREATE OR REPLACE FUNCTION create_bom_version(
  p_bom_id UUID,
  p_new_version VARCHAR(20),
  p_change_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_old_bom RECORD;
  v_line_items_snapshot JSONB;
BEGIN
  -- Get current BOM
  SELECT * INTO v_old_bom FROM boms WHERE id = p_bom_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOM not found';
  END IF;

  -- Capture line items snapshot
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'component_product_id', component_product_id,
    'quantity_required', quantity_required,
    'uom', uom,
    'position_notes', position_notes,
    'sort_order', sort_order
  ) ORDER BY sort_order), '[]'::JSONB)
  INTO v_line_items_snapshot
  FROM bom_line_items
  WHERE bom_id = p_bom_id;

  -- Record history
  INSERT INTO bom_history (
    bom_id, version, change_description, line_items_snapshot,
    changed_by_id, changed_by_name
  ) VALUES (
    p_bom_id, v_old_bom.version, p_change_description, v_line_items_snapshot,
    p_user_id, p_user_name
  );

  -- Update BOM version
  UPDATE boms
  SET version = p_new_version, updated_at = NOW()
  WHERE id = p_bom_id;

  RETURN p_bom_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get BOM with all components expanded
CREATE OR REPLACE FUNCTION get_bom_with_components(p_bom_id UUID)
RETURNS TABLE (
  bom_id UUID,
  bom_name TEXT,
  finished_product_id UUID,
  finished_product_sku TEXT,
  finished_product_name TEXT,
  output_quantity INT,
  expected_scrap_percent DECIMAL,
  component_product_id UUID,
  component_sku TEXT,
  component_name TEXT,
  quantity_required DECIMAL,
  uom TEXT,
  position_notes TEXT,
  component_unit_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS bom_id,
    b.name AS bom_name,
    b.finished_product_id,
    fp.sku AS finished_product_sku,
    fp.name AS finished_product_name,
    b.output_quantity,
    b.expected_scrap_percent,
    bli.component_product_id,
    cp.sku AS component_sku,
    cp.name AS component_name,
    bli.quantity_required,
    bli.uom,
    bli.position_notes,
    cp.unit_cost AS component_unit_cost
  FROM boms b
  JOIN products fp ON fp.id = b.finished_product_id
  JOIN bom_line_items bli ON bli.bom_id = b.id
  JOIN products cp ON cp.id = bli.component_product_id
  WHERE b.id = p_bom_id
  ORDER BY bli.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate estimated BOM cost (based on product unit costs)
CREATE OR REPLACE FUNCTION calculate_bom_estimated_cost(p_bom_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_cost DECIMAL := 0;
  v_output_quantity INT;
BEGIN
  SELECT output_quantity INTO v_output_quantity FROM boms WHERE id = p_bom_id;

  SELECT COALESCE(SUM(bli.quantity_required * p.unit_cost), 0)
  INTO v_total_cost
  FROM bom_line_items bli
  JOIN products p ON p.id = bli.component_product_id
  WHERE bli.bom_id = p_bom_id;

  RETURN v_total_cost / NULLIF(v_output_quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: Row Level Security
-- ============================================================================

ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_history ENABLE ROW LEVEL SECURITY;

-- BOMs policies
CREATE POLICY "Authenticated users can view boms"
  ON boms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert boms"
  ON boms FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update boms"
  ON boms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete boms"
  ON boms FOR DELETE TO authenticated USING (true);

-- BOM Line Items policies
CREATE POLICY "Authenticated users can view bom_line_items"
  ON bom_line_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bom_line_items"
  ON bom_line_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bom_line_items"
  ON bom_line_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bom_line_items"
  ON bom_line_items FOR DELETE TO authenticated USING (true);

-- BOM History policies
CREATE POLICY "Authenticated users can view bom_history"
  ON bom_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bom_history"
  ON bom_history FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- SECTION 9: Views
-- ============================================================================

-- View: Active BOMs with component count and estimated cost
CREATE OR REPLACE VIEW active_boms_summary AS
SELECT
  b.id,
  b.name,
  b.version,
  b.finished_product_id,
  p.sku AS finished_product_sku,
  p.name AS finished_product_name,
  b.output_quantity,
  b.expected_scrap_percent,
  COUNT(bli.id) AS component_count,
  calculate_bom_estimated_cost(b.id) AS estimated_unit_cost,
  b.created_at,
  b.updated_at
FROM boms b
JOIN products p ON p.id = b.finished_product_id
LEFT JOIN bom_line_items bli ON bli.bom_id = b.id
WHERE b.is_active = true
GROUP BY b.id, p.sku, p.name;

-- View: Components used across BOMs (for "used in" display)
CREATE OR REPLACE VIEW component_usage AS
SELECT
  p.id AS component_id,
  p.sku AS component_sku,
  p.name AS component_name,
  COUNT(DISTINCT b.id) AS used_in_bom_count,
  jsonb_agg(jsonb_build_object(
    'bom_id', b.id,
    'bom_name', b.name,
    'finished_product_name', fp.name,
    'quantity_required', bli.quantity_required
  )) AS bom_usage
FROM products p
JOIN bom_line_items bli ON bli.component_product_id = p.id
JOIN boms b ON b.id = bli.bom_id AND b.is_active = true
JOIN products fp ON fp.id = b.finished_product_id
WHERE p.product_type = 'component'
GROUP BY p.id, p.sku, p.name;
