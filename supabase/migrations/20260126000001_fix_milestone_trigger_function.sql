-- Migration: Fix trigger value typos in handle_po_milestone_triggers function
-- The enum uses underscores (po_confirmed, goods_received) but the function was using hyphens

-- Fix the handle_po_milestone_triggers function
CREATE OR REPLACE FUNCTION handle_po_milestone_triggers()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle PO confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE invoice_payment_schedule_items psi
    SET
      trigger_status = 'triggered',
      trigger_date = NOW(),
      due_date = CURRENT_DATE + psi.offset_days
    FROM invoices i
    WHERE psi.invoice_id = i.id
      AND i.linked_entity_type = 'purchase-order'
      AND i.linked_entity_id = NEW.id
      AND psi.trigger = 'po_confirmed'  -- Fixed: was 'po-confirmed'
      AND psi.trigger_status = 'pending';
  END IF;

  -- Handle PO received (goods_received trigger)
  IF NEW.status IN ('received', 'partially-received')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('received', 'partially-received')) THEN
    UPDATE invoice_payment_schedule_items psi
    SET
      trigger_status = 'triggered',
      trigger_date = NOW(),
      due_date = CURRENT_DATE + psi.offset_days
    FROM invoices i
    WHERE psi.invoice_id = i.id
      AND i.linked_entity_type = 'purchase-order'
      AND i.linked_entity_id = NEW.id
      AND psi.trigger = 'goods_received'  -- Fixed: was 'goods-received'
      AND psi.trigger_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
