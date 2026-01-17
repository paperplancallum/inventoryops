-- Invoices & Payments Migration
-- Creates tables for invoice management, payment tracking, and milestone-based schedules

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Invoice type enum
CREATE TYPE invoice_type AS ENUM (
  'product',
  'shipping',
  'duties',
  'inspection',
  'storage'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'unpaid',
  'partial',
  'paid',
  'overdue'
);

-- Linked entity type enum
CREATE TYPE linked_entity_type AS ENUM (
  'purchase-order',
  'shipment',
  'batch',
  'inspection'
);

-- Payment method enum
CREATE TYPE payment_method AS ENUM (
  'wire-transfer',
  'credit-card',
  'paypal',
  'check',
  'other'
);

-- Invoice creation method enum
CREATE TYPE invoice_creation_method AS ENUM (
  'manual',
  'automatic'
);

-- Payment trigger status enum
CREATE TYPE payment_trigger_status AS ENUM (
  'pending',
  'triggered',
  'overdue'
);

-- =============================================================================
-- INVOICE NUMBER SEQUENCE
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  next_seq := nextval('invoice_number_seq');
  RETURN 'INV-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT generate_invoice_number(),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  type invoice_type NOT NULL,
  linked_entity_type linked_entity_type NOT NULL,
  linked_entity_id UUID NOT NULL,
  linked_entity_name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (amount - paid_amount) STORED,
  status payment_status NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  notes TEXT,
  creation_method invoice_creation_method NOT NULL DEFAULT 'manual',
  payment_terms_template_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  brand_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice Payment Schedule Items (milestones)
CREATE TABLE invoice_payment_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  trigger payment_milestone_trigger NOT NULL,
  trigger_status payment_trigger_status NOT NULL DEFAULT 'pending',
  trigger_date TIMESTAMPTZ,
  due_date DATE,
  offset_days INT NOT NULL DEFAULT 0,
  paid_date DATE,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice Payments
CREATE TABLE invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  schedule_item_id UUID REFERENCES invoice_payment_schedule_items(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  reference TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice Payment Attachments
CREATE TABLE invoice_payment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES invoice_payments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Invoices indexes
CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_linked_entity ON invoices(linked_entity_type, linked_entity_id);
CREATE INDEX idx_invoices_brand ON invoices(brand_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Schedule items indexes
CREATE INDEX idx_invoice_schedule_items_invoice ON invoice_payment_schedule_items(invoice_id);
CREATE INDEX idx_invoice_schedule_items_trigger ON invoice_payment_schedule_items(trigger);
CREATE INDEX idx_invoice_schedule_items_status ON invoice_payment_schedule_items(trigger_status);
CREATE INDEX idx_invoice_schedule_items_due_date ON invoice_payment_schedule_items(due_date);

-- Payments indexes
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_date ON invoice_payments(date);
CREATE INDEX idx_invoice_payments_schedule_item ON invoice_payments(schedule_item_id);

-- Attachments indexes
CREATE INDEX idx_invoice_payment_attachments_payment ON invoice_payment_attachments(payment_id);

-- =============================================================================
-- TRIGGERS - Auto-update timestamps
-- =============================================================================

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER invoice_schedule_items_updated_at
  BEFORE UPDATE ON invoice_payment_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGERS - Recalculate invoice totals when payment changes
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_invoice_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  inv_id UUID;
  new_paid_amount DECIMAL(12, 2);
BEGIN
  -- Get the invoice ID
  IF TG_OP = 'DELETE' THEN
    inv_id := OLD.invoice_id;
  ELSE
    inv_id := NEW.invoice_id;
  END IF;

  -- Calculate new paid amount
  SELECT COALESCE(SUM(amount), 0) INTO new_paid_amount
  FROM invoice_payments
  WHERE invoice_id = inv_id;

  -- Update invoice paid_amount
  UPDATE invoices
  SET paid_amount = new_paid_amount
  WHERE id = inv_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_payments_recalc_insert
  AFTER INSERT ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_paid_amount();

CREATE TRIGGER invoice_payments_recalc_update
  AFTER UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_paid_amount();

CREATE TRIGGER invoice_payments_recalc_delete
  AFTER DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_paid_amount();

-- =============================================================================
-- TRIGGERS - Update invoice status based on paid_amount
-- =============================================================================

CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if paid_amount changed
  IF OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    IF NEW.paid_amount >= NEW.amount THEN
      NEW.status := 'paid';
    ELSIF NEW.paid_amount > 0 THEN
      NEW.status := 'partial';
    ELSIF NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'unpaid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_status_update
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();

-- =============================================================================
-- TRIGGERS - Update schedule item paid amount
-- =============================================================================

CREATE OR REPLACE FUNCTION update_schedule_item_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  item_id UUID;
  new_paid DECIMAL(12, 2);
  item_amount DECIMAL(12, 2);
BEGIN
  -- Get the schedule item ID
  IF TG_OP = 'DELETE' THEN
    item_id := OLD.schedule_item_id;
  ELSE
    item_id := NEW.schedule_item_id;
  END IF;

  -- Only proceed if there's a schedule item
  IF item_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Calculate new paid amount for this schedule item
  SELECT COALESCE(SUM(amount), 0) INTO new_paid
  FROM invoice_payments
  WHERE schedule_item_id = item_id;

  -- Get the item's total amount
  SELECT amount INTO item_amount
  FROM invoice_payment_schedule_items
  WHERE id = item_id;

  -- Update schedule item
  UPDATE invoice_payment_schedule_items
  SET
    paid_amount = new_paid,
    paid_date = CASE WHEN new_paid >= item_amount THEN CURRENT_DATE ELSE NULL END
  WHERE id = item_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_payments_schedule_update_insert
  AFTER INSERT ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_item_paid_amount();

CREATE TRIGGER invoice_payments_schedule_update_update
  AFTER UPDATE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_item_paid_amount();

CREATE TRIGGER invoice_payments_schedule_update_delete
  AFTER DELETE ON invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_item_paid_amount();

-- =============================================================================
-- FUNCTION - Check and update overdue invoices
-- =============================================================================

CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
BEGIN
  -- Update invoices where due_date has passed and not fully paid
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('unpaid', 'partial')
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;

  -- Update schedule items where due_date has passed and not fully paid
  UPDATE invoice_payment_schedule_items
  SET trigger_status = 'overdue'
  WHERE trigger_status = 'triggered'
    AND paid_amount < amount
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION - Calculate invoice due date from earliest unpaid milestone
-- =============================================================================

CREATE OR REPLACE FUNCTION update_invoice_due_date()
RETURNS TRIGGER AS $$
DECLARE
  earliest_due DATE;
BEGIN
  -- Find earliest unpaid milestone due date
  SELECT MIN(due_date) INTO earliest_due
  FROM invoice_payment_schedule_items
  WHERE invoice_id = NEW.invoice_id
    AND paid_amount < amount
    AND due_date IS NOT NULL;

  -- Update invoice due_date
  UPDATE invoices
  SET due_date = earliest_due
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_item_due_date_change
  AFTER INSERT OR UPDATE OF due_date, paid_amount ON invoice_payment_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_due_date();

-- =============================================================================
-- FUNCTION - Auto-create invoice for PO
-- =============================================================================

CREATE OR REPLACE FUNCTION create_invoice_for_po()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_supplier_name TEXT;
  v_template_id UUID;
  v_milestones JSONB;
  v_brand_id UUID;
  v_brand_name TEXT;
  v_milestone JSONB;
  v_sort INT := 0;
BEGIN
  -- Only create invoice if PO has a total > 0
  IF NEW.total IS NULL OR NEW.total <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get supplier name and payment terms template
  SELECT s.name, s.payment_terms_template_id
  INTO v_supplier_name, v_template_id
  FROM suppliers s
  WHERE s.id = NEW.supplier_id;

  -- Get brand from first line item's product (if exists)
  SELECT p.brand_id, b.name
  INTO v_brand_id, v_brand_name
  FROM po_line_items li
  JOIN products p ON p.id = li.product_id
  LEFT JOIN brands b ON b.id = p.brand_id
  WHERE li.purchase_order_id = NEW.id
  ORDER BY li.sort_order
  LIMIT 1;

  -- Get template milestones if exists
  IF v_template_id IS NOT NULL THEN
    SELECT milestones INTO v_milestones
    FROM payment_terms_templates
    WHERE id = v_template_id;
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
    'Product cost - ' || NEW.po_number,
    'product',
    'purchase-order',
    NEW.id,
    NEW.po_number || COALESCE(' - ' || v_supplier_name, ''),
    NEW.total,
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
        -- If trigger is 'upfront', mark as triggered immediately
        trigger_status,
        trigger_date,
        due_date
      ) VALUES (
        v_invoice_id,
        v_milestone->>'name',
        (v_milestone->>'percentage')::DECIMAL,
        NEW.total * (v_milestone->>'percentage')::DECIMAL / 100,
        (v_milestone->>'trigger')::payment_milestone_trigger,
        COALESCE((v_milestone->>'offsetDays')::INT, 0),
        v_sort,
        CASE WHEN v_milestone->>'trigger' = 'upfront' THEN 'triggered' ELSE 'pending' END,
        CASE WHEN v_milestone->>'trigger' = 'upfront' THEN NOW() ELSE NULL END,
        CASE WHEN v_milestone->>'trigger' = 'upfront' THEN CURRENT_DATE + COALESCE((v_milestone->>'offsetDays')::INT, 0) ELSE NULL END
      );
    END LOOP;
  ELSE
    -- No template, create single 100% milestone due on order
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
      NEW.total,
      'manual',
      'pending',
      NULL,
      NULL,
      1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_create_invoice_trigger
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_for_po();

-- =============================================================================
-- FUNCTION - Update invoice amount when PO total changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_invoice_for_po_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if total changed
  IF OLD.total IS DISTINCT FROM NEW.total THEN
    UPDATE invoices
    SET
      amount = NEW.total,
      -- Also update schedule items proportionally
      updated_at = NOW()
    WHERE linked_entity_type = 'purchase-order'
      AND linked_entity_id = NEW.id;

    -- Update schedule item amounts proportionally
    UPDATE invoice_payment_schedule_items psi
    SET amount = NEW.total * psi.percentage / 100
    FROM invoices i
    WHERE psi.invoice_id = i.id
      AND i.linked_entity_type = 'purchase-order'
      AND i.linked_entity_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_update_invoice_trigger
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_for_po_change();

-- =============================================================================
-- TRIGGER - PO status change triggers milestones
-- =============================================================================

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
      AND psi.trigger = 'po-confirmed'
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
      AND psi.trigger = 'goods-received'
      AND psi.trigger_status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_milestone_trigger
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_po_milestone_triggers();

-- =============================================================================
-- VIEW - Financial Summary
-- =============================================================================

CREATE OR REPLACE VIEW financial_summary AS
SELECT
  COALESCE(SUM(amount), 0)::DECIMAL(12, 2) AS total_invoices,
  COALESCE(SUM(paid_amount), 0)::DECIMAL(12, 2) AS total_paid,
  COALESCE(SUM(balance), 0)::DECIMAL(12, 2) AS outstanding,
  COUNT(*) FILTER (WHERE status = 'overdue')::INT AS overdue_count,
  COALESCE(SUM(balance) FILTER (WHERE
    due_date IS NOT NULL AND
    due_date <= CURRENT_DATE + INTERVAL '7 days' AND
    status IN ('unpaid', 'partial')
  ), 0)::DECIMAL(12, 2) AS upcoming_this_week
FROM invoices;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payment_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payment_attachments ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (true);

-- Invoice Payment Schedule Items policies
CREATE POLICY "Authenticated users can view invoice_payment_schedule_items"
  ON invoice_payment_schedule_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert invoice_payment_schedule_items"
  ON invoice_payment_schedule_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice_payment_schedule_items"
  ON invoice_payment_schedule_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete invoice_payment_schedule_items"
  ON invoice_payment_schedule_items FOR DELETE
  TO authenticated
  USING (true);

-- Invoice Payments policies
CREATE POLICY "Authenticated users can view invoice_payments"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert invoice_payments"
  ON invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoice_payments"
  ON invoice_payments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete invoice_payments"
  ON invoice_payments FOR DELETE
  TO authenticated
  USING (true);

-- Invoice Payment Attachments policies
CREATE POLICY "Authenticated users can view invoice_payment_attachments"
  ON invoice_payment_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert invoice_payment_attachments"
  ON invoice_payment_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invoice_payment_attachments"
  ON invoice_payment_attachments FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-attachments', 'payment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload payment attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-attachments');

CREATE POLICY "Authenticated users can view payment attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-attachments');

CREATE POLICY "Authenticated users can delete payment attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-attachments');
