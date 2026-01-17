-- =============================================================================
-- Migration: Move Invoice Creation from PO Creation to PI Approval
-- =============================================================================
-- Problem: Invoices currently auto-created when PO is created (estimated prices)
-- Solution: Create invoice when Proforma Invoice (PI) is approved (confirmed prices)
-- =============================================================================

-- =============================================================================
-- 1. DROP AUTO-INVOICE TRIGGER ON PO CREATION
-- =============================================================================
-- Keep the function (might be useful for manual calls), just remove the automatic trigger
DROP TRIGGER IF EXISTS po_create_invoice_trigger ON purchase_orders;

-- =============================================================================
-- 2. ADD REVISION TRACKING TO SUPPLIER INVOICE SUBMISSIONS
-- =============================================================================

-- Add revision tracking columns
ALTER TABLE supplier_invoice_submissions
ADD COLUMN IF NOT EXISTS revision_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_submission_id UUID REFERENCES supplier_invoice_submissions(id) ON DELETE SET NULL;

-- Add index for revision chain lookups
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_submissions_previous
ON supplier_invoice_submissions(previous_submission_id)
WHERE previous_submission_id IS NOT NULL;

-- Add index for PO + revision lookups
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_submissions_po_revision
ON supplier_invoice_submissions(purchase_order_id, revision_number);

-- =============================================================================
-- 3. CREATE FUNCTION TO CREATE INVOICE ON PI APPROVAL
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

  -- Get brand info from first line item
  SELECT b.* INTO v_brand
  FROM purchase_order_line_items poli
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
    COALESCE(v_po.currency, 'USD'),
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

-- Create trigger for PI approval
CREATE TRIGGER pi_approval_create_invoice_trigger
  AFTER UPDATE ON supplier_invoice_submissions
  FOR EACH ROW
  WHEN (OLD.review_status IS DISTINCT FROM NEW.review_status)
  EXECUTE FUNCTION create_invoice_from_pi_approval();

-- =============================================================================
-- 4. UPDATE CREATION_METHOD ENUM TO INCLUDE 'from-pi-approval'
-- =============================================================================

-- Add new value to enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'from-pi-approval'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'invoice_creation_method')
  ) THEN
    ALTER TYPE invoice_creation_method ADD VALUE IF NOT EXISTS 'from-pi-approval';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 5. FUNCTION TO CREATE REVISION MAGIC LINK
-- =============================================================================

CREATE OR REPLACE FUNCTION create_revision_magic_link(
  p_submission_id UUID,
  p_rejection_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  new_magic_link_id UUID,
  new_token TEXT,
  new_revision_number INTEGER
) AS $$
DECLARE
  v_submission RECORD;
  v_new_token TEXT;
  v_new_link_id UUID;
  v_new_revision INTEGER;
BEGIN
  -- Get the original submission
  SELECT * INTO v_submission
  FROM supplier_invoice_submissions
  WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found: %', p_submission_id;
  END IF;

  -- Calculate new revision number
  v_new_revision := v_submission.revision_number + 1;

  -- Generate new token
  v_new_token := encode(gen_random_bytes(32), 'hex');

  -- Create new magic link
  INSERT INTO magic_links (
    purpose,
    entity_type,
    entity_id,
    token_hash,
    recipient_email,
    recipient_name,
    expires_at,
    status,
    metadata
  ) VALUES (
    'invoice-submission',
    'purchase-order',
    v_submission.purchase_order_id,
    encode(sha256(v_new_token::bytea), 'hex'),
    v_submission.submitted_by_email,
    v_submission.submitted_by_name,
    NOW() + INTERVAL '14 days',
    'active',
    jsonb_build_object(
      'revision_number', v_new_revision,
      'previous_submission_id', p_submission_id,
      'rejection_notes', p_rejection_notes,
      'po_number', v_submission.po_number
    )
  )
  RETURNING id INTO v_new_link_id;

  -- Update old submission review notes if rejection notes provided
  IF p_rejection_notes IS NOT NULL THEN
    UPDATE supplier_invoice_submissions
    SET review_notes = COALESCE(review_notes, '') ||
        CASE WHEN review_notes IS NOT NULL THEN E'\n---\n' ELSE '' END ||
        'Rejected for revision: ' || p_rejection_notes
    WHERE id = p_submission_id;
  END IF;

  RETURN QUERY SELECT v_new_link_id, v_new_token, v_new_revision;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION create_invoice_from_pi_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION create_revision_magic_link(UUID, TEXT) TO authenticated;
