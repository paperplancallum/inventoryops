-- Inventory Triggers Migration
-- Auto-create batches and stock ledger entries when PO is received

-- =============================================================================
-- FUNCTION: Create batch from PO line item
-- =============================================================================

CREATE OR REPLACE FUNCTION create_batch_from_po_line_item(
  p_po_id UUID,
  p_line_item_id UUID,
  p_factory_location_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
  v_line_item RECORD;
  v_po RECORD;
BEGIN
  -- Get line item details
  SELECT * INTO v_line_item
  FROM po_line_items
  WHERE id = p_line_item_id;

  -- Get PO details
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = p_po_id;

  -- Check if batch already exists for this line item
  IF EXISTS (SELECT 1 FROM batches WHERE po_line_item_id = p_line_item_id) THEN
    -- Return existing batch ID
    SELECT id INTO v_batch_id FROM batches WHERE po_line_item_id = p_line_item_id;
    RETURN v_batch_id;
  END IF;

  -- Create new batch
  INSERT INTO batches (
    po_id,
    po_line_item_id,
    product_id,
    sku,
    product_name,
    quantity,
    stage,
    supplier_id,
    unit_cost,
    ordered_date,
    expected_arrival,
    notes
  )
  VALUES (
    p_po_id,
    p_line_item_id,
    v_line_item.product_id,
    v_line_item.sku,
    v_line_item.product_name,
    v_line_item.quantity,
    'factory'::batch_stage,  -- Start at factory when received
    v_po.supplier_id,
    v_line_item.unit_cost,
    v_po.order_date,
    v_po.expected_date,
    'Auto-created from PO ' || v_po.po_number
  )
  RETURNING id INTO v_batch_id;

  -- Create initial stock ledger entry at factory location
  IF p_factory_location_id IS NOT NULL THEN
    INSERT INTO stock_ledger_entries (
      batch_id,
      sku,
      product_name,
      location_id,
      quantity,
      movement_type,
      unit_cost,
      reason,
      created_by
    )
    VALUES (
      v_batch_id,
      v_line_item.sku,
      v_line_item.product_name,
      p_factory_location_id,
      v_line_item.quantity,
      'initial_receipt'::stock_movement_type,
      v_line_item.unit_cost,
      'Initial receipt from PO ' || v_po.po_number,
      'system'
    );
  END IF;

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Auto-create batches when PO status changes to received
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_create_batches_on_po_received()
RETURNS TRIGGER AS $$
DECLARE
  v_line_item RECORD;
  v_factory_location_id UUID;
BEGIN
  -- Only trigger when status changes to 'received' or 'partially-received'
  IF NEW.status IN ('received', 'partially-received')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('received', 'partially-received'))
  THEN
    -- Get the factory location for the supplier
    SELECT factory_location_id INTO v_factory_location_id
    FROM suppliers
    WHERE id = NEW.supplier_id;

    -- Create batches for each line item that doesn't already have one
    FOR v_line_item IN
      SELECT id FROM po_line_items
      WHERE purchase_order_id = NEW.id
        AND NOT EXISTS (
          SELECT 1 FROM batches WHERE po_line_item_id = po_line_items.id
        )
    LOOP
      PERFORM create_batch_from_po_line_item(
        NEW.id,
        v_line_item.id,
        v_factory_location_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_received_create_batches
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_batches_on_po_received();

-- =============================================================================
-- FUNCTION: Split batch
-- =============================================================================

CREATE OR REPLACE FUNCTION split_batch(
  p_batch_id UUID,
  p_split_quantity INT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_original_batch RECORD;
  v_new_batch_id UUID;
  v_remaining_quantity INT;
BEGIN
  -- Get original batch
  SELECT * INTO v_original_batch
  FROM batches
  WHERE id = p_batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found: %', p_batch_id;
  END IF;

  -- Validate split quantity
  IF p_split_quantity <= 0 THEN
    RAISE EXCEPTION 'Split quantity must be positive';
  END IF;

  IF p_split_quantity >= v_original_batch.quantity THEN
    RAISE EXCEPTION 'Split quantity must be less than original quantity';
  END IF;

  v_remaining_quantity := v_original_batch.quantity - p_split_quantity;

  -- Update original batch quantity
  UPDATE batches
  SET
    quantity = v_remaining_quantity,
    notes = COALESCE(notes, '') ||
      E'\n[Split] ' || p_split_quantity || ' units split to new batch on ' || NOW()::DATE
  WHERE id = p_batch_id;

  -- Create new batch with split quantity
  INSERT INTO batches (
    po_id,
    po_line_item_id,
    product_id,
    sku,
    product_name,
    quantity,
    stage,
    supplier_id,
    unit_cost,
    ordered_date,
    expected_arrival,
    actual_arrival,
    notes
  )
  VALUES (
    v_original_batch.po_id,
    v_original_batch.po_line_item_id,
    v_original_batch.product_id,
    v_original_batch.sku,
    v_original_batch.product_name,
    p_split_quantity,
    v_original_batch.stage,
    v_original_batch.supplier_id,
    v_original_batch.unit_cost,  -- FIFO: preserve original cost
    v_original_batch.ordered_date,
    v_original_batch.expected_arrival,
    v_original_batch.actual_arrival,
    COALESCE(p_note, 'Split from batch ' || v_original_batch.batch_number)
  )
  RETURNING id INTO v_new_batch_id;

  RETURN v_new_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Merge batches
-- =============================================================================

CREATE OR REPLACE FUNCTION merge_batches(
  p_batch_ids UUID[],
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_first_batch RECORD;
  v_merged_batch_id UUID;
  v_total_quantity INT := 0;
  v_total_cost DECIMAL := 0;
  v_batch_id UUID;
  v_batch RECORD;
BEGIN
  -- Validate at least 2 batches
  IF array_length(p_batch_ids, 1) < 2 THEN
    RAISE EXCEPTION 'At least 2 batches required for merge';
  END IF;

  -- Get first batch as base (for SKU, product, etc.)
  SELECT * INTO v_first_batch
  FROM batches
  WHERE id = p_batch_ids[1];

  IF NOT FOUND THEN
    RAISE EXCEPTION 'First batch not found: %', p_batch_ids[1];
  END IF;

  -- Validate all batches have same SKU and calculate totals
  FOREACH v_batch_id IN ARRAY p_batch_ids
  LOOP
    SELECT * INTO v_batch
    FROM batches
    WHERE id = v_batch_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Batch not found: %', v_batch_id;
    END IF;

    IF v_batch.sku != v_first_batch.sku THEN
      RAISE EXCEPTION 'All batches must have same SKU. Found % and %', v_first_batch.sku, v_batch.sku;
    END IF;

    v_total_quantity := v_total_quantity + v_batch.quantity;
    v_total_cost := v_total_cost + v_batch.total_cost;
  END LOOP;

  -- Create merged batch with weighted average cost
  INSERT INTO batches (
    po_id,
    product_id,
    sku,
    product_name,
    quantity,
    stage,
    supplier_id,
    unit_cost,  -- Weighted average for merged batches
    ordered_date,
    expected_arrival,
    notes
  )
  VALUES (
    v_first_batch.po_id,
    v_first_batch.product_id,
    v_first_batch.sku,
    v_first_batch.product_name,
    v_total_quantity,
    v_first_batch.stage,
    v_first_batch.supplier_id,
    (v_total_cost / v_total_quantity)::DECIMAL(10,2),  -- Weighted average
    v_first_batch.ordered_date,
    v_first_batch.expected_arrival,
    COALESCE(p_note, 'Merged from ' || array_length(p_batch_ids, 1) || ' batches')
  )
  RETURNING id INTO v_merged_batch_id;

  -- Mark original batches as merged (soft delete via notes)
  UPDATE batches
  SET notes = COALESCE(notes, '') ||
    E'\n[Merged] Into batch ' || (SELECT batch_number FROM batches WHERE id = v_merged_batch_id) ||
    ' on ' || NOW()::DATE
  WHERE id = ANY(p_batch_ids);

  -- Delete original batches (cascade will handle history)
  DELETE FROM batches WHERE id = ANY(p_batch_ids);

  RETURN v_merged_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Update batch computed fields (remaining units from ledger)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_batch_remaining_units(p_batch_id UUID)
RETURNS INT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(quantity) FROM stock_ledger_entries WHERE batch_id = p_batch_id),
    0
  );
END;
$$ LANGUAGE plpgsql;
