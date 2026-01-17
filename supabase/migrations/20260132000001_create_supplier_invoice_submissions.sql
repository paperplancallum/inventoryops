-- Supplier Invoice Submissions Migration
-- Creates tables for supplier-submitted pricing via magic links with review workflow

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Review status enum
CREATE TYPE supplier_submission_review_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'partially_approved'
);

-- Additional cost type enum
CREATE TYPE supplier_additional_cost_type AS ENUM (
  'handling',
  'rush',
  'tooling',
  'shipping',
  'inspection',
  'packaging',
  'other'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Supplier Invoice Submissions (parent record)
CREATE TABLE supplier_invoice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the magic link that created this submission
  magic_link_id UUID NOT NULL REFERENCES magic_links(id) ON DELETE CASCADE,

  -- Link to the Purchase Order
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,

  -- Supplier info (from PO, denormalized)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,

  -- Submitter info (from magic link form)
  submitted_by_name TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Totals (calculated)
  expected_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  submitted_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  variance_amount DECIMAL(12, 2) GENERATED ALWAYS AS (submitted_total - expected_total) STORED,
  variance_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN expected_total = 0 THEN 0
      ELSE ROUND(((submitted_total - expected_total) / expected_total) * 100, 2)
    END
  ) STORED,

  -- Review workflow
  review_status supplier_submission_review_status NOT NULL DEFAULT 'pending',
  reviewed_by_user_id UUID,
  reviewed_by_user_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Supplier notes from submission
  supplier_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier Invoice Submission Line Items
CREATE TABLE supplier_invoice_submission_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES supplier_invoice_submissions(id) ON DELETE CASCADE,

  -- Link to the original PO line item
  po_line_item_id UUID NOT NULL REFERENCES po_line_items(id) ON DELETE CASCADE,

  -- Product info (denormalized for display)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INT NOT NULL,

  -- Expected vs Submitted pricing
  expected_unit_cost DECIMAL(10, 4) NOT NULL,
  submitted_unit_cost DECIMAL(10, 4) NOT NULL,

  -- Line totals
  expected_line_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * expected_unit_cost) STORED,
  submitted_line_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * submitted_unit_cost) STORED,
  variance_amount DECIMAL(12, 2) GENERATED ALWAYS AS ((quantity * submitted_unit_cost) - (quantity * expected_unit_cost)) STORED,

  -- Per-line review (for partial approvals)
  is_approved BOOLEAN,
  approved_unit_cost DECIMAL(10, 4),  -- Can override to different amount

  -- Supplier notes for this line
  notes TEXT,

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier Invoice Submission Additional Costs
CREATE TABLE supplier_invoice_submission_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES supplier_invoice_submissions(id) ON DELETE CASCADE,

  cost_type supplier_additional_cost_type NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),

  -- Review
  is_approved BOOLEAN,
  approved_amount DECIMAL(12, 2),

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Submission indexes
CREATE INDEX idx_supplier_submissions_magic_link ON supplier_invoice_submissions(magic_link_id);
CREATE INDEX idx_supplier_submissions_po ON supplier_invoice_submissions(purchase_order_id);
CREATE INDEX idx_supplier_submissions_supplier ON supplier_invoice_submissions(supplier_id);
CREATE INDEX idx_supplier_submissions_status ON supplier_invoice_submissions(review_status);
CREATE INDEX idx_supplier_submissions_submitted_at ON supplier_invoice_submissions(submitted_at DESC);

-- Line item indexes
CREATE INDEX idx_supplier_submission_items_submission ON supplier_invoice_submission_line_items(submission_id);
CREATE INDEX idx_supplier_submission_items_po_line ON supplier_invoice_submission_line_items(po_line_item_id);

-- Cost indexes
CREATE INDEX idx_supplier_submission_costs_submission ON supplier_invoice_submission_costs(submission_id);

-- =============================================================================
-- TRIGGERS - Auto-update timestamps
-- =============================================================================

CREATE TRIGGER supplier_invoice_submissions_updated_at
  BEFORE UPDATE ON supplier_invoice_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGERS - Recalculate submission totals
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_submission_totals()
RETURNS TRIGGER AS $$
DECLARE
  sub_id UUID;
  new_expected DECIMAL(12, 2);
  new_submitted DECIMAL(12, 2);
  additional_costs DECIMAL(12, 2);
BEGIN
  -- Get the submission ID
  IF TG_OP = 'DELETE' THEN
    sub_id := OLD.submission_id;
  ELSE
    sub_id := NEW.submission_id;
  END IF;

  -- Calculate line item totals
  SELECT
    COALESCE(SUM(quantity * expected_unit_cost), 0),
    COALESCE(SUM(quantity * submitted_unit_cost), 0)
  INTO new_expected, new_submitted
  FROM supplier_invoice_submission_line_items
  WHERE submission_id = sub_id;

  -- Add additional costs to submitted total
  SELECT COALESCE(SUM(amount), 0) INTO additional_costs
  FROM supplier_invoice_submission_costs
  WHERE submission_id = sub_id;

  -- Update submission totals
  UPDATE supplier_invoice_submissions
  SET
    expected_total = new_expected,
    submitted_total = new_submitted + additional_costs
  WHERE id = sub_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Line items triggers
CREATE TRIGGER submission_line_items_recalc_insert
  AFTER INSERT ON supplier_invoice_submission_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_totals();

CREATE TRIGGER submission_line_items_recalc_update
  AFTER UPDATE ON supplier_invoice_submission_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_totals();

CREATE TRIGGER submission_line_items_recalc_delete
  AFTER DELETE ON supplier_invoice_submission_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_totals();

-- Additional costs trigger
CREATE OR REPLACE FUNCTION recalculate_submission_costs()
RETURNS TRIGGER AS $$
DECLARE
  sub_id UUID;
  line_submitted DECIMAL(12, 2);
  additional_costs DECIMAL(12, 2);
BEGIN
  -- Get the submission ID
  IF TG_OP = 'DELETE' THEN
    sub_id := OLD.submission_id;
  ELSE
    sub_id := NEW.submission_id;
  END IF;

  -- Get line item submitted total
  SELECT COALESCE(SUM(quantity * submitted_unit_cost), 0) INTO line_submitted
  FROM supplier_invoice_submission_line_items
  WHERE submission_id = sub_id;

  -- Calculate additional costs total
  SELECT COALESCE(SUM(amount), 0) INTO additional_costs
  FROM supplier_invoice_submission_costs
  WHERE submission_id = sub_id;

  -- Update submission total
  UPDATE supplier_invoice_submissions
  SET submitted_total = line_submitted + additional_costs
  WHERE id = sub_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_costs_recalc_insert
  AFTER INSERT ON supplier_invoice_submission_costs
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_costs();

CREATE TRIGGER submission_costs_recalc_update
  AFTER UPDATE ON supplier_invoice_submission_costs
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_costs();

CREATE TRIGGER submission_costs_recalc_delete
  AFTER DELETE ON supplier_invoice_submission_costs
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_submission_costs();

-- =============================================================================
-- FUNCTION - Apply approved prices to PO
-- =============================================================================

CREATE OR REPLACE FUNCTION apply_submission_to_po(submission_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  line_item RECORD;
  sub RECORD;
BEGIN
  -- Get submission
  SELECT * INTO sub FROM supplier_invoice_submissions WHERE id = submission_id;

  IF sub.review_status NOT IN ('approved', 'partially_approved') THEN
    RAISE EXCEPTION 'Submission must be approved before applying to PO';
  END IF;

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

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEW - Submissions Summary
-- =============================================================================

CREATE OR REPLACE VIEW supplier_submissions_summary AS
SELECT
  COUNT(*) FILTER (WHERE review_status = 'pending')::INT AS pending_review,
  COUNT(*) FILTER (WHERE review_status = 'approved')::INT AS approved,
  COUNT(*) FILTER (WHERE review_status = 'rejected')::INT AS rejected,
  COUNT(*) FILTER (WHERE review_status = 'partially_approved')::INT AS partially_approved,
  COALESCE(SUM(variance_amount) FILTER (WHERE review_status = 'pending'), 0)::DECIMAL(12, 2) AS pending_variance_total
FROM supplier_invoice_submissions;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE supplier_invoice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_submission_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_submission_costs ENABLE ROW LEVEL SECURITY;

-- Authenticated user policies
CREATE POLICY "Authenticated users can view supplier_invoice_submissions"
  ON supplier_invoice_submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier_invoice_submissions"
  ON supplier_invoice_submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update supplier_invoice_submissions"
  ON supplier_invoice_submissions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete supplier_invoice_submissions"
  ON supplier_invoice_submissions FOR DELETE
  TO authenticated
  USING (true);

-- Line items policies
CREATE POLICY "Authenticated users can view supplier_invoice_submission_line_items"
  ON supplier_invoice_submission_line_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier_invoice_submission_line_items"
  ON supplier_invoice_submission_line_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update supplier_invoice_submission_line_items"
  ON supplier_invoice_submission_line_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete supplier_invoice_submission_line_items"
  ON supplier_invoice_submission_line_items FOR DELETE
  TO authenticated
  USING (true);

-- Costs policies
CREATE POLICY "Authenticated users can view supplier_invoice_submission_costs"
  ON supplier_invoice_submission_costs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supplier_invoice_submission_costs"
  ON supplier_invoice_submission_costs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update supplier_invoice_submission_costs"
  ON supplier_invoice_submission_costs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete supplier_invoice_submission_costs"
  ON supplier_invoice_submission_costs FOR DELETE
  TO authenticated
  USING (true);

-- Anonymous access for form submissions
CREATE POLICY "Anon can insert supplier_invoice_submissions"
  ON supplier_invoice_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can insert supplier_invoice_submission_line_items"
  ON supplier_invoice_submission_line_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can insert supplier_invoice_submission_costs"
  ON supplier_invoice_submission_costs FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE supplier_invoice_submissions IS 'Supplier-submitted pricing via magic links, pending internal review';
COMMENT ON TABLE supplier_invoice_submission_line_items IS 'Line items with expected vs submitted pricing';
COMMENT ON TABLE supplier_invoice_submission_costs IS 'Additional costs submitted by supplier';
COMMENT ON COLUMN supplier_invoice_submissions.variance_amount IS 'Difference between submitted and expected totals';
COMMENT ON COLUMN supplier_invoice_submissions.variance_percentage IS 'Percentage difference from expected';
COMMENT ON FUNCTION apply_submission_to_po(UUID) IS 'Apply approved prices from submission to PO line items';
