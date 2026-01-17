-- =============================================================================
-- Fix: Clear PO inspection status when inspection is deleted
-- =============================================================================

-- Trigger to clear PO status when inspection is deleted
CREATE OR REPLACE FUNCTION clear_po_inspection_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Clear single PO if set
  IF OLD.purchase_order_id IS NOT NULL THEN
    UPDATE purchase_orders
    SET
      inspection_id = NULL,
      inspection_status = NULL
    WHERE id = OLD.purchase_order_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clear_po_inspection_on_delete_trigger ON inspections;
CREATE TRIGGER clear_po_inspection_on_delete_trigger
  BEFORE DELETE ON inspections
  FOR EACH ROW EXECUTE FUNCTION clear_po_inspection_on_delete();

-- Trigger to clear PO status when junction link is removed
CREATE OR REPLACE FUNCTION clear_po_on_inspection_unlink()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET
    inspection_id = NULL,
    inspection_status = NULL
  WHERE id = OLD.purchase_order_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clear_po_on_inspection_unlink_trigger ON inspection_purchase_orders;
CREATE TRIGGER clear_po_on_inspection_unlink_trigger
  BEFORE DELETE ON inspection_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION clear_po_on_inspection_unlink();
