-- Inventory Batches Migration
-- Creates tables for batch tracking through pipeline stages

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Batch pipeline stage
CREATE TYPE batch_stage AS ENUM (
  'ordered',
  'factory',
  'inspected',
  'in-transit',
  'warehouse',
  'amazon'
);

-- Stock movement type for ledger entries
CREATE TYPE stock_movement_type AS ENUM (
  'initial_receipt',
  'transfer_out',
  'transfer_in',
  'adjustment_add',
  'adjustment_remove',
  'amazon_reconcile'
);

-- =============================================================================
-- BATCH NUMBER SEQUENCE
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS batch_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  next_seq := nextval('batch_number_seq');
  RETURN 'BATCH-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Batches: A trackable lot of inventory from a PO line item
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE DEFAULT generate_batch_number(),

  -- Link to purchase order (nullable for manual batches)
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  po_line_item_id UUID REFERENCES po_line_items(id) ON DELETE SET NULL,

  -- Product info
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,

  -- Quantity (immutable - original ordered amount)
  quantity INT NOT NULL CHECK (quantity > 0),

  -- Pipeline stage
  stage batch_stage NOT NULL DEFAULT 'ordered',

  -- Supplier info
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,

  -- Cost tracking (FIFO - costs stay with batch)
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Dates
  ordered_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_arrival DATE,
  actual_arrival DATE,

  -- Future: Link to transfer/shipment
  shipment_id UUID,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batch stage history: Audit trail of stage transitions
CREATE TABLE batch_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  stage batch_stage NOT NULL,
  note TEXT,
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Batch attachments: Photos and documents
CREATE TABLE batch_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'photo' or 'document'
  url TEXT NOT NULL,
  storage_path TEXT,
  size INT,
  uploaded_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_batches_po ON batches(po_id);
CREATE INDEX idx_batches_po_line_item ON batches(po_line_item_id);
CREATE INDEX idx_batches_product ON batches(product_id);
CREATE INDEX idx_batches_stage ON batches(stage);
CREATE INDEX idx_batches_sku ON batches(sku);
CREATE INDEX idx_batches_supplier ON batches(supplier_id);
CREATE INDEX idx_batches_ordered_date ON batches(ordered_date);
CREATE INDEX idx_batches_batch_number ON batches(batch_number);

CREATE INDEX idx_batch_stage_history_batch ON batch_stage_history(batch_id);
CREATE INDEX idx_batch_stage_history_created ON batch_stage_history(created_at);

CREATE INDEX idx_batch_attachments_batch ON batch_attachments(batch_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER batches_updated_at
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-record stage history on stage change
CREATE OR REPLACE FUNCTION record_batch_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO batch_stage_history (batch_id, stage, note)
    VALUES (NEW.id, NEW.stage, 'Stage changed from ' || OLD.stage || ' to ' || NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_stage_change_trigger
  AFTER UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION record_batch_stage_change();

-- Auto-create initial stage history entry on insert
CREATE OR REPLACE FUNCTION record_batch_initial_stage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO batch_stage_history (batch_id, stage, note)
  VALUES (NEW.id, NEW.stage, 'Batch created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_initial_stage_trigger
  AFTER INSERT ON batches
  FOR EACH ROW
  EXECUTE FUNCTION record_batch_initial_stage();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_attachments ENABLE ROW LEVEL SECURITY;

-- Batches policies
CREATE POLICY "Authenticated users can view batches"
  ON batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete batches"
  ON batches FOR DELETE
  TO authenticated
  USING (true);

-- Batch stage history policies
CREATE POLICY "Authenticated users can view batch_stage_history"
  ON batch_stage_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert batch_stage_history"
  ON batch_stage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Batch attachments policies
CREATE POLICY "Authenticated users can view batch_attachments"
  ON batch_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert batch_attachments"
  ON batch_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete batch_attachments"
  ON batch_attachments FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('batch-attachments', 'batch-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload batch attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'batch-attachments');

CREATE POLICY "Authenticated users can view batch attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'batch-attachments');

CREATE POLICY "Authenticated users can delete batch attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'batch-attachments');
