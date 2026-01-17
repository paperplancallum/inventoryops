-- Repair migration: ensure change log table and functions exist
-- This handles cases where partial migration was applied

-- Ensure table exists (will no-op if already exists)
CREATE TABLE IF NOT EXISTS batch_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  related_batch_ids UUID[] DEFAULT '{}',
  related_batch_numbers TEXT[] DEFAULT '{}',
  quantity_before INT,
  quantity_after INT,
  quantity_change INT,
  unit_cost DECIMAL(10, 2),
  total_value_before DECIMAL(12, 2),
  total_value_after DECIMAL(12, 2),
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  created_by_name TEXT
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_batch_change_log_batch_id ON batch_change_log(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_change_log_created_at ON batch_change_log(created_at DESC);

-- Enable RLS if not already
ALTER TABLE batch_change_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they exist
DROP POLICY IF EXISTS "Users can view change log" ON batch_change_log;
DROP POLICY IF EXISTS "Users can insert change log" ON batch_change_log;

CREATE POLICY "Users can view change log"
  ON batch_change_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert change log"
  ON batch_change_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- RECREATE split_batch function with logging
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
    v_original_batch.unit_cost,
    v_original_batch.ordered_date,
    v_original_batch.expected_arrival,
    v_original_batch.actual_arrival,
    COALESCE(p_note, 'Split from batch ' || v_original_batch.batch_number)
  )
  RETURNING id, batch_number INTO v_new_batch_id, v_new_batch_number;

  -- Log the split for the NEW batch (created)
  INSERT INTO batch_change_log (
    change_type,
    batch_id,
    batch_number,
    related_batch_ids,
    related_batch_numbers,
    quantity_before,
    quantity_after,
    quantity_change,
    unit_cost,
    total_value_before,
    total_value_after,
    sku,
    product_name,
    note
  ) VALUES (
    'split',
    v_new_batch_id,
    v_new_batch_number,
    ARRAY[p_batch_id],
    ARRAY[v_original_batch.batch_number],
    0,
    p_split_quantity,
    p_split_quantity,
    v_original_batch.unit_cost,
    0,
    p_split_quantity * v_original_batch.unit_cost,
    v_original_batch.sku,
    v_original_batch.product_name,
    COALESCE(p_note, 'Split ' || p_split_quantity || ' units from ' || v_original_batch.batch_number)
  );

  -- Log the split for the ORIGINAL batch (reduced)
  INSERT INTO batch_change_log (
    change_type,
    batch_id,
    batch_number,
    related_batch_ids,
    related_batch_numbers,
    quantity_before,
    quantity_after,
    quantity_change,
    unit_cost,
    total_value_before,
    total_value_after,
    sku,
    product_name,
    note
  ) VALUES (
    'split',
    p_batch_id,
    v_original_batch.batch_number,
    ARRAY[v_new_batch_id],
    ARRAY[v_new_batch_number],
    v_original_batch.quantity,
    v_remaining_quantity,
    -p_split_quantity,
    v_original_batch.unit_cost,
    v_original_batch.total_cost,
    v_remaining_quantity * v_original_batch.unit_cost,
    v_original_batch.sku,
    v_original_batch.product_name,
    COALESCE(p_note, 'Split ' || p_split_quantity || ' units to ' || v_new_batch_number)
  );

  RETURN v_new_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RECREATE merge_batches function with logging
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

  -- Log the merge for the NEW merged batch
  INSERT INTO batch_change_log (
    change_type,
    batch_id,
    batch_number,
    related_batch_ids,
    related_batch_numbers,
    quantity_before,
    quantity_after,
    quantity_change,
    unit_cost,
    total_value_before,
    total_value_after,
    sku,
    product_name,
    note
  ) VALUES (
    'merge',
    v_merged_batch_id,
    v_merged_batch_number,
    p_batch_ids,
    v_source_batch_numbers,
    0,
    v_total_quantity,
    v_total_quantity,
    v_weighted_unit_cost,
    0,
    v_total_cost,
    v_first_batch.sku,
    v_first_batch.product_name,
    COALESCE(p_note, 'Merged from ' || array_length(p_batch_ids, 1) || ' batches: ' || array_to_string(v_source_batch_numbers, ', '))
  );

  -- Delete original batches (log each one)
  FOREACH v_batch_id IN ARRAY p_batch_ids
  LOOP
    SELECT * INTO v_batch FROM batches WHERE id = v_batch_id;

    -- Log deletion of source batch
    INSERT INTO batch_change_log (
      change_type,
      batch_id,
      batch_number,
      related_batch_ids,
      related_batch_numbers,
      quantity_before,
      quantity_after,
      quantity_change,
      unit_cost,
      total_value_before,
      total_value_after,
      sku,
      product_name,
      note
    ) VALUES (
      'merge',
      v_batch_id,
      v_batch.batch_number,
      ARRAY[v_merged_batch_id],
      ARRAY[v_merged_batch_number],
      v_batch.quantity,
      0,
      -v_batch.quantity,
      v_batch.unit_cost,
      v_batch.total_cost,
      0,
      v_batch.sku,
      v_batch.product_name,
      'Merged into ' || v_merged_batch_number
    );

    DELETE FROM batches WHERE id = v_batch_id;
  END LOOP;

  RETURN v_merged_batch_id;
END;
$$ LANGUAGE plpgsql;
