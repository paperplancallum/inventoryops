-- Purchase Orders Migration
-- Creates tables for purchase order management

-- =============================================================================
-- TYPES
-- =============================================================================

-- PO Status enum
CREATE TYPE po_status AS ENUM (
  'draft',
  'sent',
  'confirmed',
  'partially-received',
  'received',
  'cancelled'
);

-- Inspection decision status enum
CREATE TYPE inspection_decision_status AS ENUM (
  'pending',
  'scheduled',
  'not-needed'
);

-- Supplier invoice status enum
CREATE TYPE supplier_invoice_status AS ENUM (
  'none',
  'pending-submission',
  'pending-review',
  'approved',
  'rejected'
);

-- Message direction enum
CREATE TYPE message_direction AS ENUM (
  'outbound',
  'inbound',
  'note'
);

-- =============================================================================
-- PO NUMBER SEQUENCE
-- =============================================================================

-- Sequence for PO numbers (per year)
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  next_seq := nextval('po_number_seq');
  RETURN 'PO-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE DEFAULT generate_po_number(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  status po_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  payment_terms TEXT,
  payment_terms_template_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,
  notes TEXT,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Inspection fields
  requires_inspection BOOLEAN DEFAULT false,
  inspection_status inspection_decision_status DEFAULT 'pending',
  inspection_id UUID, -- Will reference inspections table when built

  -- Supplier Invoice fields
  supplier_invoice_status supplier_invoice_status DEFAULT 'none',
  supplier_invoice_id UUID, -- Will reference supplier_invoices table when built
  invoice_link_sent_at TIMESTAMPTZ,
  invoice_submitted_at TIMESTAMPTZ,
  invoice_reviewed_at TIMESTAMPTZ,
  invoice_variance DECIMAL(12, 2),
  invoice_variance_percent DECIMAL(5, 2),

  -- Message tracking
  unread_count INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit fields
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT
);

-- PO Line Items
CREATE TABLE po_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10, 2) NOT NULL CHECK (unit_cost >= 0),
  subtotal DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Status History
CREATE TABLE po_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  status po_status NOT NULL,
  note TEXT,
  changed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Messages (conversation thread with supplier)
CREATE TABLE po_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Message Attachments
CREATE TABLE po_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES po_messages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PO Documents (generated PDFs)
CREATE TABLE po_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  file_size INT,
  version INT NOT NULL DEFAULT 1,
  snapshot_data JSONB, -- Stores PO data at generation time
  generated_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_expected_date ON purchase_orders(expected_date);
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);

CREATE INDEX idx_po_line_items_po ON po_line_items(purchase_order_id);
CREATE INDEX idx_po_line_items_product ON po_line_items(product_id);
CREATE INDEX idx_po_line_items_sku ON po_line_items(sku);

CREATE INDEX idx_po_status_history_po ON po_status_history(purchase_order_id);
CREATE INDEX idx_po_status_history_created ON po_status_history(created_at);

CREATE INDEX idx_po_messages_po ON po_messages(purchase_order_id);
CREATE INDEX idx_po_messages_created ON po_messages(created_at);

CREATE INDEX idx_po_documents_po ON po_documents(purchase_order_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER po_line_items_updated_at
  BEFORE UPDATE ON po_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create status history entry on status change
CREATE OR REPLACE FUNCTION record_po_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO po_status_history (purchase_order_id, status, note)
    VALUES (NEW.id, NEW.status, 'Status changed');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_status_change_trigger
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_po_status_change();

-- Auto-create initial status history entry on insert
CREATE OR REPLACE FUNCTION record_po_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO po_status_history (purchase_order_id, status, note)
  VALUES (NEW.id, NEW.status, 'PO created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_initial_status_trigger
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION record_po_initial_status();

-- Auto-recalculate PO totals when line items change
CREATE OR REPLACE FUNCTION recalculate_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  po_id UUID;
  new_subtotal DECIMAL(12, 2);
BEGIN
  -- Get the PO ID depending on operation
  IF TG_OP = 'DELETE' THEN
    po_id := OLD.purchase_order_id;
  ELSE
    po_id := NEW.purchase_order_id;
  END IF;

  -- Calculate new subtotal
  SELECT COALESCE(SUM(quantity * unit_cost), 0) INTO new_subtotal
  FROM po_line_items
  WHERE purchase_order_id = po_id;

  -- Update PO totals
  UPDATE purchase_orders
  SET subtotal = new_subtotal, total = new_subtotal
  WHERE id = po_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_line_items_totals_insert
  AFTER INSERT ON po_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_po_totals();

CREATE TRIGGER po_line_items_totals_update
  AFTER UPDATE ON po_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_po_totals();

CREATE TRIGGER po_line_items_totals_delete
  AFTER DELETE ON po_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_po_totals();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_documents ENABLE ROW LEVEL SECURITY;

-- Authenticated users can manage all POs (no role-based access for now)
CREATE POLICY "Authenticated users can view purchase_orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase_orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase_orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete purchase_orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- PO Line Items
CREATE POLICY "Authenticated users can view po_line_items"
  ON po_line_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert po_line_items"
  ON po_line_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update po_line_items"
  ON po_line_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete po_line_items"
  ON po_line_items FOR DELETE
  TO authenticated
  USING (true);

-- PO Status History
CREATE POLICY "Authenticated users can view po_status_history"
  ON po_status_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert po_status_history"
  ON po_status_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- PO Messages
CREATE POLICY "Authenticated users can view po_messages"
  ON po_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert po_messages"
  ON po_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update po_messages"
  ON po_messages FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete po_messages"
  ON po_messages FOR DELETE
  TO authenticated
  USING (true);

-- PO Attachments
CREATE POLICY "Authenticated users can view po_attachments"
  ON po_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert po_attachments"
  ON po_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete po_attachments"
  ON po_attachments FOR DELETE
  TO authenticated
  USING (true);

-- PO Documents
CREATE POLICY "Authenticated users can view po_documents"
  ON po_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert po_documents"
  ON po_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete po_documents"
  ON po_documents FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

-- Create storage bucket for PO documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('po-documents', 'po-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for PO documents
CREATE POLICY "Authenticated users can upload PO documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'po-documents');

CREATE POLICY "Authenticated users can view PO documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'po-documents');

CREATE POLICY "Authenticated users can delete PO documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'po-documents');
