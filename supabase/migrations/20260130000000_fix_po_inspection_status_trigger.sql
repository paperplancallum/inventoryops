-- =============================================================================
-- Fix: Update PO inspection status trigger
-- The original trigger tried to cast inspection_status (enum) to TEXT
-- but the purchase_orders.inspection_status column expects inspection_decision_status enum
-- =============================================================================

-- Drop the old trigger first
DROP TRIGGER IF EXISTS update_po_on_inspection_change ON inspections;

-- Replace the function with a corrected version
CREATE OR REPLACE FUNCTION update_po_inspection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the PO's inspection_id and set inspection_status to 'scheduled'
  -- (since an inspection existing means it's been scheduled)
  UPDATE purchase_orders
  SET
    inspection_id = NEW.id,
    inspection_status = 'scheduled'::inspection_decision_status
  WHERE id = NEW.purchase_order_id;

  -- If inspection passed, update PO to ready-to-ship (if not already shipped)
  IF NEW.status = 'passed' AND (OLD IS NULL OR OLD.status != 'passed') THEN
    UPDATE purchase_orders
    SET status = 'ready-to-ship'
    WHERE id = NEW.purchase_order_id
      AND status NOT IN ('shipped', 'delivered', 'cancelled');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_po_on_inspection_change
  AFTER INSERT OR UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_po_inspection_status();
