-- Migration: Fix handle_po_production_complete trigger to use correct column names
-- The batch_stage_history table has: batch_id, stage, note, changed_by_id
-- NOT: from_stage, to_stage, changed_by_name

CREATE OR REPLACE FUNCTION handle_po_production_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO production_complete
  IF NEW.status = 'production_complete' AND (OLD.status IS NULL OR OLD.status != 'production_complete') THEN
    -- Only auto-advance if inspection is NOT required
    IF NEW.requires_inspection = false OR NEW.requires_inspection IS NULL THEN
      -- Move all batches at 'factory' stage to 'ready_to_ship'
      -- Note: The batch update will trigger record_batch_stage_change() which auto-records history
      UPDATE batches
      SET stage = 'ready_to_ship',
          updated_at = NOW()
      WHERE po_id = NEW.id
        AND stage = 'factory';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION handle_po_production_complete() IS
'Automatically advances batches from factory to ready_to_ship when PO status
changes to production_complete, but only if inspection is not required.
Products requiring inspection remain at factory stage until inspection passes.
Stage history is recorded automatically by the record_batch_stage_change trigger.';
