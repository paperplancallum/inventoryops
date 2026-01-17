-- Migration: Add ready_to_ship batch stage and production_complete PO status
-- Purpose: Track finished goods at supplier warehouse ready for shipment

-- ============================================================================
-- 1. Add ready_to_ship to batch_stage enum (after 'inspected')
-- ============================================================================
ALTER TYPE batch_stage ADD VALUE IF NOT EXISTS 'ready_to_ship' AFTER 'inspected';

-- ============================================================================
-- 2. Add production_complete to po_status enum (after 'confirmed')
-- ============================================================================
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'production_complete' AFTER 'confirmed';

-- ============================================================================
-- 3. Create trigger: When PO status changes to production_complete,
--    auto-move non-inspection batches to ready_to_ship
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_po_production_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO production_complete
  IF NEW.status = 'production_complete' AND (OLD.status IS NULL OR OLD.status != 'production_complete') THEN
    -- Only auto-advance if inspection is NOT required
    IF NEW.requires_inspection = false OR NEW.requires_inspection IS NULL THEN
      -- Move all batches at 'factory' stage to 'ready_to_ship'
      UPDATE batches
      SET stage = 'ready_to_ship',
          updated_at = NOW()
      WHERE po_id = NEW.id
        AND stage = 'factory';

      -- Also record stage history for affected batches
      INSERT INTO batch_stage_history (batch_id, from_stage, to_stage, changed_by_name, note)
      SELECT
        id,
        'factory',
        'ready_to_ship',
        'System',
        'Auto-advanced: PO marked as production complete (no inspection required)'
      FROM batches
      WHERE po_id = NEW.id
        AND stage = 'ready_to_ship'
        AND updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS po_production_complete_trigger ON purchase_orders;
CREATE TRIGGER po_production_complete_trigger
AFTER UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION handle_po_production_complete();

-- ============================================================================
-- 4. Add comment for documentation
-- ============================================================================
COMMENT ON FUNCTION handle_po_production_complete() IS
'Automatically advances batches from factory to ready_to_ship when PO status
changes to production_complete, but only if inspection is not required.
Products requiring inspection remain at factory stage until inspection passes.';
