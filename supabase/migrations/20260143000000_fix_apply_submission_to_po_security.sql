-- =============================================================================
-- Migration: Fix apply_submission_to_po security
-- =============================================================================
-- Adds SECURITY DEFINER to allow the function to bypass RLS when called
-- by authenticated users. Without this, RLS blocks access to the tables.
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_submission_to_po(submission_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  line_item RECORD;
  sub RECORD;
  v_po_id UUID;
BEGIN
  -- Get submission
  SELECT * INTO sub FROM supplier_invoice_submissions WHERE id = submission_id;

  IF sub IS NULL THEN
    RAISE EXCEPTION 'Submission not found: %', submission_id;
  END IF;

  IF sub.review_status NOT IN ('approved', 'partially_approved') THEN
    RAISE EXCEPTION 'Submission must be approved before applying to PO. Current status: %', sub.review_status;
  END IF;

  -- Store PO ID
  v_po_id := sub.purchase_order_id;

  -- Update PO line items with approved prices
  FOR line_item IN
    SELECT * FROM supplier_invoice_submission_line_items
    WHERE supplier_invoice_submission_line_items.submission_id = apply_submission_to_po.submission_id
      AND is_approved = true
  LOOP
    UPDATE po_line_items
    SET
      unit_cost = COALESCE(line_item.approved_unit_cost, line_item.submitted_unit_cost),
      updated_at = NOW()
    WHERE id = line_item.po_line_item_id;
  END LOOP;

  -- Recalculate PO totals
  UPDATE purchase_orders
  SET
    subtotal = (
      SELECT COALESCE(SUM(quantity * unit_cost), 0)
      FROM po_line_items
      WHERE purchase_order_id = v_po_id
    ),
    total = (
      SELECT COALESCE(SUM(quantity * unit_cost), 0)
      FROM po_line_items
      WHERE purchase_order_id = v_po_id
    ),
    updated_at = NOW()
  WHERE id = v_po_id;

  -- Update PO status to confirmed
  UPDATE purchase_orders
  SET
    status = 'confirmed',
    confirmed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_po_id
    AND status = 'invoice_received';

  -- Add status history entry
  INSERT INTO po_status_history (
    purchase_order_id,
    status,
    note
  ) VALUES (
    v_po_id,
    'confirmed',
    'Invoice approved - PO confirmed'
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_submission_to_po(UUID) TO authenticated;

COMMENT ON FUNCTION apply_submission_to_po(UUID) IS 'Apply approved prices from submission to PO line items. Uses SECURITY DEFINER to bypass RLS.';
