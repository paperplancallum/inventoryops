-- Migration: Create Work Order System
-- Tables for assembly/kitting work orders that consume components and produce finished goods

-- ============================================================================
-- SECTION 1: Work Order Number Sequence
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS work_order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  next_seq := nextval('work_order_number_seq');
  RETURN 'WO-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: Work Order Tables
-- ============================================================================

-- Work Orders: Assembly/kitting jobs
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE DEFAULT generate_work_order_number(),

  -- BOM being executed
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE RESTRICT,

  -- Status
  status work_order_status NOT NULL DEFAULT 'draft',

  -- Location where assembly happens (any location type allowed)
  assembly_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  -- Planned vs actual quantities
  planned_output_quantity INT NOT NULL CHECK (planned_output_quantity > 0),
  actual_output_quantity INT,
  scrap_quantity INT DEFAULT 0,

  -- Dates
  scheduled_start_date DATE,
  scheduled_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Link to output batch (created when work order completes)
  output_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Audit
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Component Consumption: Tracks which component batches are consumed
CREATE TABLE IF NOT EXISTS work_order_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Link to BOM line item (for traceability)
  bom_line_item_id UUID NOT NULL REFERENCES bom_line_items(id) ON DELETE RESTRICT,

  -- Component batch being consumed
  component_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,

  -- Quantity allocated/consumed from this batch
  quantity_allocated INT NOT NULL CHECK (quantity_allocated > 0),
  quantity_consumed INT, -- Actual consumption (filled on completion)

  -- Cost at time of allocation (FIFO from batch)
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (COALESCE(quantity_consumed, quantity_allocated) * unit_cost) STORED,

  -- Stock ledger entry for consumption (created when WO completes)
  consumption_ledger_entry_id UUID,

  -- Sort order
  sort_order INT NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Costs: Fees associated with assembly
CREATE TABLE IF NOT EXISTS work_order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Cost details
  cost_type work_order_cost_type NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),

  -- For per-unit costs, the rate and quantity
  is_per_unit BOOLEAN NOT NULL DEFAULT false,
  per_unit_rate DECIMAL(10, 4),
  quantity INT,

  -- Optional link to invoice for tracking payments
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Status History
CREATE TABLE IF NOT EXISTS work_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status work_order_status NOT NULL,
  note TEXT,
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: Work Order Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_location ON work_orders(assembly_location_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_output_batch ON work_orders(output_batch_id) WHERE output_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled ON work_orders(scheduled_start_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(work_order_number);

CREATE INDEX IF NOT EXISTS idx_wo_components_work_order ON work_order_components(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_components_batch ON work_order_components(component_batch_id);
CREATE INDEX IF NOT EXISTS idx_wo_components_bom_line_item ON work_order_components(bom_line_item_id);

CREATE INDEX IF NOT EXISTS idx_wo_costs_work_order ON work_order_costs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_costs_invoice ON work_order_costs(invoice_id) WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wo_status_history_wo ON work_order_status_history(work_order_id);

-- ============================================================================
-- SECTION 4: Work Order Triggers
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER work_order_components_updated_at
  BEFORE UPDATE ON work_order_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Record status changes
CREATE OR REPLACE FUNCTION record_work_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO work_order_status_history (work_order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);

    -- Set actual dates based on status
    IF NEW.status = 'in_progress' AND OLD.status = 'planned' THEN
      NEW.actual_start_date := CURRENT_DATE;
    ELSIF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
      NEW.actual_end_date := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_order_status_change_trigger
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_status_change();

CREATE OR REPLACE FUNCTION record_work_order_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO work_order_status_history (work_order_id, status, note, created_by_id, created_by_name)
  VALUES (NEW.id, NEW.status, 'Work order created', NEW.created_by_id, NEW.created_by_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_order_initial_status_trigger
  AFTER INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_work_order_initial_status();

-- ============================================================================
-- SECTION 5: Batch Splitting Function
-- ============================================================================

-- Function to split a batch when allocating partial quantities
CREATE OR REPLACE FUNCTION split_batch(
  p_batch_id UUID,
  p_split_quantity INT,
  p_location_id UUID,
  p_reason TEXT DEFAULT 'Split for work order allocation'
)
RETURNS UUID AS $$
DECLARE
  v_original_batch RECORD;
  v_new_batch_id UUID;
  v_original_stock INT;
  v_new_batch_number TEXT;
BEGIN
  -- Get original batch
  SELECT * INTO v_original_batch FROM batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;

  -- Check available stock at location
  SELECT COALESCE(SUM(quantity), 0) INTO v_original_stock
  FROM stock_ledger_entries
  WHERE batch_id = p_batch_id AND location_id = p_location_id;

  IF v_original_stock < p_split_quantity THEN
    RAISE EXCEPTION 'Insufficient stock to split. Available: %, Requested: %', v_original_stock, p_split_quantity;
  END IF;

  IF v_original_stock = p_split_quantity THEN
    -- No split needed, return original batch
    RETURN p_batch_id;
  END IF;

  -- Generate new batch number
  v_new_batch_number := v_original_batch.batch_number || '-S' || EXTRACT(EPOCH FROM NOW())::INT;

  -- Create new batch with split quantity
  INSERT INTO batches (
    po_id, po_line_item_id, product_id, sku, product_name,
    quantity, stage, supplier_id, unit_cost, ordered_date,
    expected_arrival, actual_arrival, notes
  ) VALUES (
    v_original_batch.po_id,
    v_original_batch.po_line_item_id,
    v_original_batch.product_id,
    v_original_batch.sku,
    v_original_batch.product_name,
    p_split_quantity,
    v_original_batch.stage,
    v_original_batch.supplier_id,
    v_original_batch.unit_cost,
    v_original_batch.ordered_date,
    v_original_batch.expected_arrival,
    v_original_batch.actual_arrival,
    'Split from batch ' || v_original_batch.batch_number || '. ' || COALESCE(v_original_batch.notes, '')
  ) RETURNING id INTO v_new_batch_id;

  -- Update new batch number (after ID is generated)
  UPDATE batches SET batch_number = v_new_batch_number WHERE id = v_new_batch_id;

  -- Create stock ledger entries for the split
  -- Debit from original batch
  INSERT INTO stock_ledger_entries (
    batch_id, sku, product_name, location_id, quantity,
    movement_type, unit_cost, reason, notes, created_by
  ) VALUES (
    p_batch_id,
    v_original_batch.sku,
    v_original_batch.product_name,
    p_location_id,
    -p_split_quantity,
    'batch_split_out',
    v_original_batch.unit_cost,
    p_reason,
    'Split to create batch ' || v_new_batch_number,
    'system'
  );

  -- Credit to new batch
  INSERT INTO stock_ledger_entries (
    batch_id, sku, product_name, location_id, quantity,
    movement_type, unit_cost, reason, notes, created_by
  ) VALUES (
    v_new_batch_id,
    v_original_batch.sku,
    v_original_batch.product_name,
    p_location_id,
    p_split_quantity,
    'batch_split_in',
    v_original_batch.unit_cost,
    p_reason,
    'Split from batch ' || v_original_batch.batch_number,
    'system'
  );

  RETURN v_new_batch_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: Work Order Validation Function
-- ============================================================================

-- Validate component availability when starting work order
CREATE OR REPLACE FUNCTION validate_work_order_components()
RETURNS TRIGGER AS $$
DECLARE
  v_component RECORD;
  v_available_stock BIGINT;
BEGIN
  -- Only validate when changing to 'in_progress'
  IF NEW.status = 'in_progress' AND OLD.status = 'planned' THEN
    FOR v_component IN
      SELECT woc.*, b.sku, b.product_name
      FROM work_order_components woc
      JOIN batches b ON b.id = woc.component_batch_id
      WHERE woc.work_order_id = NEW.id
    LOOP
      -- Check available stock at assembly location
      SELECT COALESCE(SUM(quantity), 0) INTO v_available_stock
      FROM stock_ledger_entries
      WHERE batch_id = v_component.component_batch_id
        AND location_id = NEW.assembly_location_id;

      IF v_available_stock < v_component.quantity_allocated THEN
        RAISE EXCEPTION 'Insufficient component stock for % (%). Available: %, Required: %',
          v_component.product_name, v_component.sku, v_available_stock, v_component.quantity_allocated;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_order_component_validation_trigger
  BEFORE UPDATE OF status ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_work_order_components();

-- ============================================================================
-- SECTION 7: Work Order Completion Function
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_work_order(
  p_work_order_id UUID,
  p_actual_output_quantity INT,
  p_scrap_quantity INT DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_work_order RECORD;
  v_bom RECORD;
  v_finished_product RECORD;
  v_component RECORD;
  v_output_batch_id UUID;
  v_total_component_cost DECIMAL(12, 2) := 0;
  v_total_assembly_cost DECIMAL(12, 2) := 0;
  v_unit_cost DECIMAL(10, 4);
  v_ledger_entry_id UUID;
  v_batch_number TEXT;
BEGIN
  -- Get work order
  SELECT * INTO v_work_order FROM work_orders WHERE id = p_work_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work order not found';
  END IF;

  IF v_work_order.status != 'in_progress' THEN
    RAISE EXCEPTION 'Work order must be in_progress to complete. Current status: %', v_work_order.status;
  END IF;

  IF p_actual_output_quantity <= 0 THEN
    RAISE EXCEPTION 'Actual output quantity must be greater than 0';
  END IF;

  -- Get BOM and finished product
  SELECT * INTO v_bom FROM boms WHERE id = v_work_order.bom_id;
  SELECT * INTO v_finished_product FROM products WHERE id = v_bom.finished_product_id;

  -- Process component consumption
  FOR v_component IN
    SELECT woc.*, b.sku, b.product_name
    FROM work_order_components woc
    JOIN batches b ON b.id = woc.component_batch_id
    WHERE woc.work_order_id = p_work_order_id
    ORDER BY woc.sort_order
  LOOP
    -- Create stock ledger entry for consumption
    INSERT INTO stock_ledger_entries (
      batch_id, sku, product_name, location_id, quantity,
      movement_type, unit_cost, reason, notes, created_by
    ) VALUES (
      v_component.component_batch_id,
      v_component.sku,
      v_component.product_name,
      v_work_order.assembly_location_id,
      -v_component.quantity_allocated,
      'assembly_consumption',
      v_component.unit_cost,
      'Work order ' || v_work_order.work_order_number || ' completion',
      'Consumed in assembly of ' || v_finished_product.name,
      'system'
    ) RETURNING id INTO v_ledger_entry_id;

    -- Update component record
    UPDATE work_order_components
    SET
      quantity_consumed = v_component.quantity_allocated,
      consumption_ledger_entry_id = v_ledger_entry_id
    WHERE id = v_component.id;

    -- Accumulate component cost
    v_total_component_cost := v_total_component_cost + (v_component.quantity_allocated * v_component.unit_cost);
  END LOOP;

  -- Sum assembly costs
  SELECT COALESCE(SUM(amount), 0) INTO v_total_assembly_cost
  FROM work_order_costs
  WHERE work_order_id = p_work_order_id;

  -- Calculate unit cost for finished goods
  v_unit_cost := (v_total_component_cost + v_total_assembly_cost) / NULLIF(p_actual_output_quantity, 0);

  -- Generate batch number for output
  v_batch_number := 'WO-' || v_work_order.work_order_number || '-OUT';

  -- Create output batch for finished goods
  INSERT INTO batches (
    batch_number,
    product_id,
    sku,
    product_name,
    quantity,
    stage,
    unit_cost,
    ordered_date,
    actual_arrival,
    notes
  ) VALUES (
    v_batch_number,
    v_finished_product.id,
    v_finished_product.sku,
    v_finished_product.name,
    p_actual_output_quantity,
    'factory', -- Starts at assembly location
    v_unit_cost,
    CURRENT_DATE,
    CURRENT_DATE,
    'Produced from work order ' || v_work_order.work_order_number ||
    '. Components: $' || ROUND(v_total_component_cost, 2) ||
    ', Assembly: $' || ROUND(v_total_assembly_cost, 2) ||
    CASE WHEN p_scrap_quantity > 0 THEN '. Scrap: ' || p_scrap_quantity || ' units' ELSE '' END
  ) RETURNING id INTO v_output_batch_id;

  -- Create stock ledger entry for output
  INSERT INTO stock_ledger_entries (
    batch_id, sku, product_name, location_id, quantity,
    movement_type, unit_cost, reason, notes, created_by
  ) VALUES (
    v_output_batch_id,
    v_finished_product.sku,
    v_finished_product.name,
    v_work_order.assembly_location_id,
    p_actual_output_quantity,
    'assembly_output',
    v_unit_cost,
    'Work order ' || v_work_order.work_order_number || ' output',
    'Assembled finished goods',
    'system'
  );

  -- Update work order
  UPDATE work_orders
  SET
    status = 'completed',
    actual_output_quantity = p_actual_output_quantity,
    scrap_quantity = p_scrap_quantity,
    actual_end_date = CURRENT_DATE,
    output_batch_id = v_output_batch_id,
    notes = CASE
      WHEN p_notes IS NOT NULL THEN COALESCE(notes || E'\n', '') || p_notes
      ELSE notes
    END
  WHERE id = p_work_order_id;

  RETURN v_output_batch_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: Row Level Security
-- ============================================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_status_history ENABLE ROW LEVEL SECURITY;

-- Work Orders policies
CREATE POLICY "Authenticated users can view work_orders"
  ON work_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert work_orders"
  ON work_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_orders"
  ON work_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_orders"
  ON work_orders FOR DELETE TO authenticated USING (true);

-- Work Order Components policies
CREATE POLICY "Authenticated users can view work_order_components"
  ON work_order_components FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert work_order_components"
  ON work_order_components FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_order_components"
  ON work_order_components FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_order_components"
  ON work_order_components FOR DELETE TO authenticated USING (true);

-- Work Order Costs policies
CREATE POLICY "Authenticated users can view work_order_costs"
  ON work_order_costs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert work_order_costs"
  ON work_order_costs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_order_costs"
  ON work_order_costs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_order_costs"
  ON work_order_costs FOR DELETE TO authenticated USING (true);

-- Work Order Status History policies
CREATE POLICY "Authenticated users can view work_order_status_history"
  ON work_order_status_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert work_order_status_history"
  ON work_order_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- SECTION 9: Views
-- ============================================================================

-- View: Work orders with BOM and location details
CREATE OR REPLACE VIEW work_orders_with_details AS
SELECT
  wo.id,
  wo.work_order_number,
  wo.status,
  wo.bom_id,
  b.name AS bom_name,
  b.finished_product_id,
  fp.sku AS finished_product_sku,
  fp.name AS finished_product_name,
  wo.assembly_location_id,
  l.name AS assembly_location_name,
  wo.planned_output_quantity,
  wo.actual_output_quantity,
  wo.scrap_quantity,
  wo.scheduled_start_date,
  wo.scheduled_end_date,
  wo.actual_start_date,
  wo.actual_end_date,
  wo.output_batch_id,
  ob.batch_number AS output_batch_number,
  ob.unit_cost AS output_unit_cost,
  (SELECT COUNT(*) FROM work_order_components woc WHERE woc.work_order_id = wo.id) AS component_count,
  (SELECT COALESCE(SUM(total_cost), 0) FROM work_order_components woc WHERE woc.work_order_id = wo.id) AS total_component_cost,
  (SELECT COALESCE(SUM(amount), 0) FROM work_order_costs wc WHERE wc.work_order_id = wo.id) AS total_assembly_cost,
  wo.notes,
  wo.created_by_name,
  wo.created_at,
  wo.updated_at
FROM work_orders wo
JOIN boms b ON b.id = wo.bom_id
JOIN products fp ON fp.id = b.finished_product_id
JOIN locations l ON l.id = wo.assembly_location_id
LEFT JOIN batches ob ON ob.id = wo.output_batch_id;

-- View: Finished goods with landed cost breakdown
CREATE OR REPLACE VIEW finished_goods_landed_cost AS
SELECT
  wo.id AS work_order_id,
  wo.work_order_number,
  ob.id AS batch_id,
  ob.batch_number,
  ob.sku,
  ob.product_name,
  ob.quantity,
  ob.unit_cost AS assembly_unit_cost,

  -- Component breakdown
  (SELECT COALESCE(SUM(woc.quantity_consumed * woc.unit_cost), 0)
   FROM work_order_components woc
   WHERE woc.work_order_id = wo.id) AS total_component_cost,

  -- Assembly costs breakdown
  (SELECT COALESCE(SUM(amount), 0) FROM work_order_costs
   WHERE work_order_id = wo.id AND is_per_unit = false) AS flat_assembly_costs,
  (SELECT COALESCE(SUM(amount), 0) FROM work_order_costs
   WHERE work_order_id = wo.id AND is_per_unit = true) AS per_unit_assembly_costs,

  -- Transfer costs (if batch has been transferred)
  (SELECT COALESCE(SUM(
    COALESCE(t.cost_freight, 0) + COALESCE(t.cost_insurance, 0) +
    COALESCE(t.cost_duties, 0) + COALESCE(t.cost_taxes, 0) +
    COALESCE(t.cost_handling, 0) + COALESCE(t.cost_other, 0)
  ), 0)
   FROM transfer_line_items tli
   JOIN transfers t ON t.id = tli.transfer_id
   WHERE tli.batch_id = ob.id AND t.status = 'completed') AS total_transfer_costs,

  wo.created_at AS work_order_date,
  wo.actual_end_date AS completion_date

FROM work_orders wo
JOIN batches ob ON ob.id = wo.output_batch_id
WHERE wo.status = 'completed';
