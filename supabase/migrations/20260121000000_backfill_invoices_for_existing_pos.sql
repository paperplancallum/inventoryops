-- Backfill Migration: Create invoices for existing POs that don't have invoices
-- Run this once after deploying the invoices tables

DO $$
DECLARE
  v_po RECORD;
  v_invoice_id UUID;
  v_supplier_name TEXT;
  v_template_id UUID;
  v_milestones JSONB;
  v_brand_id UUID;
  v_brand_name TEXT;
  v_milestone JSONB;
  v_sort INT;
  v_count INT := 0;
BEGIN
  -- Loop through all POs that don't have an invoice
  FOR v_po IN
    SELECT po.*
    FROM purchase_orders po
    LEFT JOIN invoices inv ON inv.linked_entity_type = 'purchase-order'
                          AND inv.linked_entity_id = po.id
    WHERE inv.id IS NULL
      AND po.total IS NOT NULL
      AND po.total > 0
  LOOP
    v_sort := 0;

    -- Get supplier name and payment terms template
    SELECT s.name, s.payment_terms_template_id
    INTO v_supplier_name, v_template_id
    FROM suppliers s
    WHERE s.id = v_po.supplier_id;

    -- Get brand from first line item's product (if exists)
    SELECT p.brand_id, b.name
    INTO v_brand_id, v_brand_name
    FROM po_line_items li
    JOIN products p ON p.id = li.product_id
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE li.purchase_order_id = v_po.id
    ORDER BY li.sort_order
    LIMIT 1;

    -- Get template milestones if exists
    IF v_template_id IS NOT NULL THEN
      SELECT milestones INTO v_milestones
      FROM payment_terms_templates
      WHERE id = v_template_id;
    ELSE
      v_milestones := NULL;
    END IF;

    -- Create invoice
    INSERT INTO invoices (
      description,
      type,
      linked_entity_type,
      linked_entity_id,
      linked_entity_name,
      amount,
      creation_method,
      payment_terms_template_id,
      brand_id,
      brand_name
    ) VALUES (
      'Product cost - ' || v_po.po_number,
      'product',
      'purchase-order',
      v_po.id,
      v_po.po_number || COALESCE(' - ' || v_supplier_name, ''),
      v_po.total,
      'automatic',
      v_template_id,
      v_brand_id,
      v_brand_name
    )
    RETURNING id INTO v_invoice_id;

    -- Create schedule items from template milestones
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
          v_po.total * (v_milestone->>'percentage')::DECIMAL / 100,
          (v_milestone->>'trigger')::payment_milestone_trigger,
          COALESCE((v_milestone->>'offsetDays')::INT, 0),
          v_sort,
          -- Check if milestone should already be triggered based on PO status
          (CASE
            WHEN v_milestone->>'trigger' = 'upfront' THEN 'triggered'
            WHEN v_milestone->>'trigger' = 'po-confirmed' AND v_po.status = 'confirmed' THEN 'triggered'
            WHEN v_milestone->>'trigger' = 'goods-received' AND v_po.status IN ('received', 'partially-received') THEN 'triggered'
            ELSE 'pending'
          END)::payment_trigger_status,
          CASE
            WHEN v_milestone->>'trigger' = 'upfront' THEN v_po.created_at
            WHEN v_milestone->>'trigger' = 'po-confirmed' AND v_po.status = 'confirmed' THEN v_po.updated_at
            WHEN v_milestone->>'trigger' = 'goods-received' AND v_po.status IN ('received', 'partially-received') THEN v_po.updated_at
            ELSE NULL
          END,
          CASE
            WHEN v_milestone->>'trigger' = 'upfront' THEN v_po.created_at::DATE + COALESCE((v_milestone->>'offsetDays')::INT, 0)
            WHEN v_milestone->>'trigger' = 'po-confirmed' AND v_po.status = 'confirmed' THEN v_po.updated_at::DATE + COALESCE((v_milestone->>'offsetDays')::INT, 0)
            WHEN v_milestone->>'trigger' = 'goods-received' AND v_po.status IN ('received', 'partially-received') THEN v_po.updated_at::DATE + COALESCE((v_milestone->>'offsetDays')::INT, 0)
            ELSE NULL
          END
        );
      END LOOP;
    ELSE
      -- No template, create single 100% milestone
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
        v_po.total,
        'manual'::payment_milestone_trigger,
        'pending'::payment_trigger_status,
        NULL,
        NULL,
        1
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: Created % invoices for existing POs', v_count;
END $$;
