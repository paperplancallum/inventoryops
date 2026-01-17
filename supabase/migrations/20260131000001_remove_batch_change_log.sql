-- =============================================================================
-- Remove obsolete batch_change_log (replaced by activity_log)
-- =============================================================================
-- The new activity_log system with triggers provides comprehensive
-- audit trail for all entities including batches.

-- =============================================================================
-- Update split_batch function to remove batch_change_log usage
-- (batch changes are now automatically captured by activity_log triggers)
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
  v_new_batch_number TEXT;
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
  -- (activity_log trigger will capture this change automatically)
  UPDATE batches
  SET
    quantity = v_remaining_quantity,
    notes = COALESCE(notes, '') ||
      E'\n[Split] ' || p_split_quantity || ' units split to new batch on ' || NOW()::DATE
  WHERE id = p_batch_id;

  -- Create new batch with split quantity
  -- (activity_log trigger will capture this creation automatically)
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
    v_original_batch.unit_cost,
    v_original_batch.ordered_date,
    v_original_batch.expected_arrival,
    v_original_batch.actual_arrival,
    COALESCE(p_note, 'Split from batch ' || v_original_batch.batch_number)
  )
  RETURNING id, batch_number INTO v_new_batch_id, v_new_batch_number;

  RETURN v_new_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Update merge_batches function to remove batch_change_log usage
-- =============================================================================

CREATE OR REPLACE FUNCTION merge_batches(
  p_batch_ids UUID[],
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_first_batch RECORD;
  v_merged_batch_id UUID;
  v_merged_batch_number TEXT;
  v_total_quantity INT := 0;
  v_total_cost DECIMAL := 0;
  v_batch_id UUID;
  v_batch RECORD;
  v_source_batch_numbers TEXT[] := '{}';
  v_weighted_unit_cost DECIMAL;
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
    v_source_batch_numbers := array_append(v_source_batch_numbers, v_batch.batch_number);
  END LOOP;

  -- Calculate weighted average unit cost
  v_weighted_unit_cost := v_total_cost / v_total_quantity;

  -- Create merged batch with weighted average cost
  -- (activity_log trigger will capture this creation automatically)
  INSERT INTO batches (
    po_id,
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
    v_first_batch.po_id,
    v_first_batch.product_id,
    v_first_batch.sku,
    v_first_batch.product_name,
    v_total_quantity,
    v_first_batch.stage,
    v_first_batch.supplier_id,
    v_weighted_unit_cost,
    v_first_batch.ordered_date,
    v_first_batch.expected_arrival,
    COALESCE(p_note, 'Merged from batches: ' || array_to_string(v_source_batch_numbers, ', '))
  )
  RETURNING id, batch_number INTO v_merged_batch_id, v_merged_batch_number;

  -- Delete original batches
  -- (activity_log trigger will capture each deletion automatically)
  FOREACH v_batch_id IN ARRAY p_batch_ids
  LOOP
    DELETE FROM batches WHERE id = v_batch_id;
  END LOOP;

  RETURN v_merged_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Drop batch_change_log table and related objects
-- =============================================================================

-- Drop policies first
DROP POLICY IF EXISTS "Users can view change log" ON batch_change_log;
DROP POLICY IF EXISTS "Users can insert change log" ON batch_change_log;

-- Drop indexes
DROP INDEX IF EXISTS idx_batch_change_log_batch_id;
DROP INDEX IF EXISTS idx_batch_change_log_created_at;

-- Drop the table
DROP TABLE IF EXISTS batch_change_log;
