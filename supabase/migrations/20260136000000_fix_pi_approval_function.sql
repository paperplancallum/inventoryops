-- =============================================================================
-- Migration: Fix create_invoice_from_pi_approval function
-- =============================================================================
-- Fixes: table name should be po_line_items, not purchase_order_line_items
-- =============================================================================

CREATE OR REPLACE FUNCTION create_invoice_from_pi_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_po RECORD;
  v_supplier RECORD;
  v_brand RECORD;
  v_invoice_id UUID;
  v_invoice_number TEXT;
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

  -- Get supplier info including payment terms
  SELECT s.*, pt.name as payment_terms_name
  INTO v_supplier
  FROM suppliers s
  LEFT JOIN payment_terms_templates pt ON pt.id = s.payment_terms_template_id
  WHERE s.id = v_po.supplier_id;

  -- Get brand info from first line item (using correct table name: po_line_items)
  SELECT b.* INTO v_brand
  FROM po_line_items poli
  JOIN products p ON p.id = poli.product_id
  JOIN brands b ON b.id = p.brand_id
  WHERE poli.purchase_order_id = NEW.purchase_order_id
  LIMIT 1;

  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(v_today, 'YYYYMMDD') || '-' ||
    LPAD((SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 14) AS INTEGER)), 0) + 1
          FROM invoices
          WHERE invoice_number LIKE 'INV-' || TO_CHAR(v_today, 'YYYYMMDD') || '-%')::TEXT, 4, '0');

  -- Create the invoice
  INSERT INTO invoices (
    invoice_number,
    type,
    linked_entity_type,
    linked_entity_id,
    brand_id,
    brand_name,
    supplier_id,
    supplier_name,
    amount,
    currency,
    status,
    description,
    creation_method
  ) VALUES (
    v_invoice_number,
    'product',
    'purchase-order',
    NEW.purchase_order_id,
    v_brand.id,
    v_brand.name,
    v_po.supplier_id,
    v_supplier.name,
    COALESCE(v_po.total, 0),
    'USD',
    'draft',
    'Invoice for PO ' || v_po.po_number || ' (from PI approval)',
    'from-pi-approval'
  )
  RETURNING id INTO v_invoice_id;

  -- Create payment schedule items from supplier's payment terms template
  IF v_supplier.payment_terms_template_id IS NOT NULL THEN
    INSERT INTO payment_schedule_items (
      invoice_id,
      milestone_name,
      milestone_trigger,
      percentage,
      amount,
      due_date,
      status,
      trigger_status
    )
    SELECT
      v_invoice_id,
      ptt.milestone_name,
      ptt.milestone_trigger,
      ptt.percentage,
      ROUND((COALESCE(v_po.total, 0) * ptt.percentage / 100), 2),
      CASE
        WHEN ptt.milestone_trigger = 'upfront' THEN v_today
        WHEN ptt.milestone_trigger = 'po-confirmed' THEN v_today -- PI approved = confirmed
        ELSE NULL
      END,
      CASE
        WHEN ptt.milestone_trigger IN ('upfront', 'po-confirmed') THEN 'due'
        ELSE 'pending'
      END,
      CASE
        WHEN ptt.milestone_trigger IN ('upfront', 'po-confirmed') THEN 'triggered'
        ELSE 'waiting'
      END
    FROM payment_terms_template_items ptt
    WHERE ptt.template_id = v_supplier.payment_terms_template_id
    ORDER BY ptt.order_index;
  ELSE
    -- Default: single 100% payment milestone
    INSERT INTO payment_schedule_items (
      invoice_id,
      milestone_name,
      milestone_trigger,
      percentage,
      amount,
      due_date,
      status,
      trigger_status
    ) VALUES (
      v_invoice_id,
      'Full Payment',
      'po-confirmed',
      100,
      COALESCE(v_po.total, 0),
      v_today,
      'due',
      'triggered'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
