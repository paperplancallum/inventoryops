-- =============================================================================
-- Migration: Fix create_invoice_from_pi_approval function (v3)
-- =============================================================================
-- Fixes:
-- 1. Remove supplier_id and supplier_name columns (don't exist on invoices table)
-- 2. Remove status column (was using invalid 'draft' value)
-- 3. Use JSONB milestones correctly
-- =============================================================================

CREATE OR REPLACE FUNCTION create_invoice_from_pi_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_po RECORD;
  v_supplier_name TEXT;
  v_template_id UUID;
  v_milestones JSONB;
  v_brand_id UUID;
  v_brand_name TEXT;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_milestone JSONB;
  v_sort INT := 0;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Only run when review_status changes to 'approved' or 'partially_approved'
  IF NEW.review_status NOT IN ('approved', 'partially_approved') THEN
    RETURN NEW;
  END IF;

  -- Only run if this is an actual status change
  IF OLD.review_status = NEW.review_status THEN
    RETURN NEW;
  END IF;

  -- Check if invoice already exists for this PO
  IF EXISTS (
    SELECT 1 FROM invoices
    WHERE linked_entity_type = 'purchase-order'
    AND linked_entity_id = NEW.purchase_order_id
  ) THEN
    -- Invoice already exists, don't create duplicate
    RETURN NEW;
  END IF;

  -- Get the PO details (with updated prices from apply_submission_to_po)
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  IF NOT FOUND THEN
    RAISE WARNING 'PO not found for PI approval: %', NEW.purchase_order_id;
    RETURN NEW;
  END IF;

  -- Get supplier name and payment terms template
  SELECT s.name, s.payment_terms_template_id
  INTO v_supplier_name, v_template_id
  FROM suppliers s
  WHERE s.id = v_po.supplier_id;

  -- Get brand from first line item's product
  SELECT p.brand_id, b.name
  INTO v_brand_id, v_brand_name
  FROM po_line_items li
  JOIN products p ON p.id = li.product_id
  LEFT JOIN brands b ON b.id = p.brand_id
  WHERE li.purchase_order_id = NEW.purchase_order_id
  ORDER BY li.sort_order
  LIMIT 1;

  -- Get template milestones if exists
  IF v_template_id IS NOT NULL THEN
    SELECT milestones INTO v_milestones
    FROM payment_terms_templates
    WHERE id = v_template_id;
  END IF;

  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(v_today, 'YYYYMMDD') || '-' ||
    LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 14) AS INTEGER)), 0) + 1
          FROM invoices
          WHERE invoice_number LIKE 'INV-' || TO_CHAR(v_today, 'YYYYMMDD') || '-%')::TEXT, 4, '0');

  -- Create the invoice (no supplier_id/supplier_name columns, no status column - uses default 'unpaid')
  INSERT INTO invoices (
    invoice_number,
    type,
    linked_entity_type,
    linked_entity_id,
    linked_entity_name,
    brand_id,
    brand_name,
    amount,
    description,
    creation_method,
    payment_terms_template_id
  ) VALUES (
    v_invoice_number,
    'product',
    'purchase-order',
    NEW.purchase_order_id,
    v_po.po_number || COALESCE(' - ' || v_supplier_name, ''),
    v_brand_id,
    v_brand_name,
    COALESCE(v_po.total, 0),
    'Product cost - ' || v_po.po_number || ' (from PI approval)',
    'from-pi-approval',
    v_template_id
  )
  RETURNING id INTO v_invoice_id;

  -- Create schedule items from template milestones (using JSONB)
  IF v_milestones IS NOT NULL AND jsonb_array_length(v_milestones) > 0 THEN
    FOR v_milestone IN SELECT * FROM jsonb_array_elements(v_milestones)
    LOOP
      v_sort := v_sort + 1;
      INSERT INTO invoice_payment_schedule_items (
        invoice_id,
        milestone_name,
        percentage,
        amount,
        trigger,
        offset_days,
        sort_order,
        trigger_status,
        trigger_date,
        due_date
      ) VALUES (
        v_invoice_id,
        v_milestone->>'name',
        (v_milestone->>'percentage')::DECIMAL,
        COALESCE(v_po.total, 0) * (v_milestone->>'percentage')::DECIMAL / 100,
        (v_milestone->>'trigger')::payment_milestone_trigger,
        COALESCE((v_milestone->>'offsetDays')::INT, 0),
        v_sort,
        -- If trigger is 'upfront' or 'po_confirmed', mark as triggered immediately since PI is now approved
        CASE
          WHEN v_milestone->>'trigger' IN ('upfront', 'po_confirmed') THEN 'triggered'
          ELSE 'pending'
        END,
        CASE
          WHEN v_milestone->>'trigger' IN ('upfront', 'po_confirmed') THEN NOW()
          ELSE NULL
        END,
        CASE
          WHEN v_milestone->>'trigger' IN ('upfront', 'po_confirmed') THEN
            v_today + COALESCE((v_milestone->>'offsetDays')::INT, 0)
          ELSE NULL
        END
      );
    END LOOP;
  ELSE
    -- No template, create single 100% milestone due now
    INSERT INTO invoice_payment_schedule_items (
      invoice_id,
      milestone_name,
      percentage,
      amount,
      trigger,
      trigger_status,
      trigger_date,
      due_date,
      sort_order
    ) VALUES (
      v_invoice_id,
      'Full Payment',
      100,
      COALESCE(v_po.total, 0),
      'po_confirmed',
      'triggered',
      NOW(),
      v_today,
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
