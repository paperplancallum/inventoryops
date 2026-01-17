-- =============================================================================
-- Inspections Module
-- Pre-shipment quality control inspection management
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Add ready-to-ship to PO status enum (if not exists)
-- -----------------------------------------------------------------------------
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'ready-to-ship' AFTER 'production_complete';

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

CREATE TYPE inspection_status AS ENUM (
  'scheduled',           -- Inspection created, awaiting agent confirmation
  'pending-confirmation', -- Sent to agent, awaiting their response
  'confirmed',           -- Agent confirmed date and submitted invoice
  'paid',                -- Invoice paid, ready for inspection
  'in-progress',         -- Agent is conducting inspection
  'report-submitted',    -- Agent submitted report, awaiting review
  'passed',              -- Internal review: passed
  'failed',              -- Internal review: failed
  'pending-rework',      -- Failed, rework requested
  're-inspection'        -- Re-inspection scheduled after rework
);

CREATE TYPE defect_severity AS ENUM ('minor', 'major', 'critical');
CREATE TYPE defect_type AS ENUM ('cosmetic', 'functional', 'dimensional', 'packaging', 'labeling');
CREATE TYPE inspection_photo_type AS ENUM ('defect', 'product', 'packaging');
CREATE TYPE line_item_result AS ENUM ('pass', 'fail', 'pending');
CREATE TYPE box_condition AS ENUM ('good', 'damaged', 'acceptable');
CREATE TYPE rework_status AS ENUM ('pending', 'in-progress', 'completed');
CREATE TYPE inspection_message_direction AS ENUM ('outbound', 'inbound', 'note');

-- -----------------------------------------------------------------------------
-- Inspection Agents Table
-- Third-party inspectors who perform quality control
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  location TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  payment_terms TEXT,
  payment_terms_template_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,
  custom_payment_milestones JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active agents lookup
CREATE INDEX idx_inspection_agents_active ON inspection_agents(is_active) WHERE is_active = true;
CREATE INDEX idx_inspection_agents_email ON inspection_agents(email);

-- -----------------------------------------------------------------------------
-- Inspections Table
-- Main inspection records linked to purchase orders
-- -----------------------------------------------------------------------------

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to purchase order
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  -- Denormalized for display
  purchase_order_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  confirmed_date DATE,
  completed_date DATE,

  -- Agent assignment
  agent_id UUID REFERENCES inspection_agents(id) ON DELETE SET NULL,
  agent_name TEXT DEFAULT 'Unassigned',

  -- Status tracking
  status inspection_status DEFAULT 'scheduled',

  -- Results (populated after review)
  result line_item_result DEFAULT 'pending',
  overall_defect_rate DECIMAL(5,2) DEFAULT 0,
  total_sample_size INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Invoice link (created when agent confirms)
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_amount DECIMAL(10,2),

  -- Magic link for agent
  magic_link_token TEXT UNIQUE,
  magic_link_expires_at TIMESTAMPTZ,

  -- Re-inspection tracking
  original_inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inspections_po ON inspections(purchase_order_id);
CREATE INDEX idx_inspections_agent ON inspections(agent_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_inspections_magic_link ON inspections(magic_link_token) WHERE magic_link_token IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Inspection Line Items Table
-- Per-product results within an inspection
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  -- Product info (from PO line item)
  po_line_item_id UUID REFERENCES po_line_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  ordered_quantity INTEGER NOT NULL,

  -- Inspection data
  sample_size INTEGER DEFAULT 0,
  defects_found INTEGER DEFAULT 0,
  defect_rate DECIMAL(5,2) DEFAULT 0,
  result line_item_result DEFAULT 'pending',

  -- Packaging check
  box_condition box_condition,
  labeling_accuracy BOOLEAN,
  barcode_scans BOOLEAN,
  packaging_notes TEXT,

  -- Sort order
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_line_items_inspection ON inspection_line_items(inspection_id);

-- -----------------------------------------------------------------------------
-- Inspection Defects Table
-- Individual defect findings
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_line_item_id UUID NOT NULL REFERENCES inspection_line_items(id) ON DELETE CASCADE,

  type defect_type NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  severity defect_severity DEFAULT 'minor',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_defects_line_item ON inspection_defects(inspection_line_item_id);

-- -----------------------------------------------------------------------------
-- Inspection Measurements Table
-- Dimension/spec checks
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_line_item_id UUID NOT NULL REFERENCES inspection_line_items(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  actual_value TEXT,
  passed BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_measurements_line_item ON inspection_measurements(inspection_line_item_id);

-- -----------------------------------------------------------------------------
-- Inspection Photos Table
-- Photo attachments for inspections
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  inspection_line_item_id UUID REFERENCES inspection_line_items(id) ON DELETE CASCADE,
  defect_id UUID REFERENCES inspection_defects(id) ON DELETE SET NULL,

  url TEXT NOT NULL,
  storage_path TEXT,
  caption TEXT,
  type inspection_photo_type DEFAULT 'product',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_photos_inspection ON inspection_photos(inspection_id);
CREATE INDEX idx_inspection_photos_line_item ON inspection_photos(inspection_line_item_id);

-- -----------------------------------------------------------------------------
-- Rework Requests Table
-- Track rework instructions for failed inspections
-- -----------------------------------------------------------------------------

CREATE TABLE rework_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  instructions TEXT NOT NULL,
  supplier_response TEXT,
  status rework_status DEFAULT 'pending',

  created_date DATE DEFAULT CURRENT_DATE,
  completed_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rework_requests_inspection ON rework_requests(inspection_id);
CREATE UNIQUE INDEX idx_rework_requests_active ON rework_requests(inspection_id) WHERE status != 'completed';

-- -----------------------------------------------------------------------------
-- Inspection Messages Table
-- Communication thread for each inspection
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  direction inspection_message_direction NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_messages_inspection ON inspection_messages(inspection_id);

-- -----------------------------------------------------------------------------
-- Inspection Message Attachments Table
-- -----------------------------------------------------------------------------

CREATE TABLE inspection_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES inspection_messages(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_message_attachments_message ON inspection_message_attachments(message_id);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Update timestamps
CREATE OR REPLACE FUNCTION update_inspection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspections_timestamp
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_inspection_timestamp();

CREATE TRIGGER update_inspection_agents_timestamp
  BEFORE UPDATE ON inspection_agents
  FOR EACH ROW EXECUTE FUNCTION update_inspection_timestamp();

CREATE TRIGGER update_inspection_line_items_timestamp
  BEFORE UPDATE ON inspection_line_items
  FOR EACH ROW EXECUTE FUNCTION update_inspection_timestamp();

CREATE TRIGGER update_rework_requests_timestamp
  BEFORE UPDATE ON rework_requests
  FOR EACH ROW EXECUTE FUNCTION update_inspection_timestamp();

-- Auto-calculate defect rate when defects change
CREATE OR REPLACE FUNCTION update_line_item_defect_rate()
RETURNS TRIGGER AS $$
DECLARE
  total_defects INTEGER;
  line_item_sample_size INTEGER;
BEGIN
  -- Get the line item's sample size
  SELECT sample_size INTO line_item_sample_size
  FROM inspection_line_items
  WHERE id = COALESCE(NEW.inspection_line_item_id, OLD.inspection_line_item_id);

  -- Count total defects for this line item
  SELECT COALESCE(SUM(quantity), 0) INTO total_defects
  FROM inspection_defects
  WHERE inspection_line_item_id = COALESCE(NEW.inspection_line_item_id, OLD.inspection_line_item_id);

  -- Update the line item's defect count and rate
  UPDATE inspection_line_items
  SET
    defects_found = total_defects,
    defect_rate = CASE
      WHEN line_item_sample_size > 0 THEN (total_defects::DECIMAL / line_item_sample_size * 100)
      ELSE 0
    END
  WHERE id = COALESCE(NEW.inspection_line_item_id, OLD.inspection_line_item_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_defect_rate_on_insert
  AFTER INSERT ON inspection_defects
  FOR EACH ROW EXECUTE FUNCTION update_line_item_defect_rate();

CREATE TRIGGER update_defect_rate_on_update
  AFTER UPDATE ON inspection_defects
  FOR EACH ROW EXECUTE FUNCTION update_line_item_defect_rate();

CREATE TRIGGER update_defect_rate_on_delete
  AFTER DELETE ON inspection_defects
  FOR EACH ROW EXECUTE FUNCTION update_line_item_defect_rate();

-- Auto-calculate overall inspection defect rate
CREATE OR REPLACE FUNCTION update_inspection_overall_rate()
RETURNS TRIGGER AS $$
DECLARE
  total_defects INTEGER;
  total_samples INTEGER;
BEGIN
  -- Sum up all line items
  SELECT
    COALESCE(SUM(defects_found), 0),
    COALESCE(SUM(sample_size), 0)
  INTO total_defects, total_samples
  FROM inspection_line_items
  WHERE inspection_id = COALESCE(NEW.inspection_id, OLD.inspection_id);

  -- Update the inspection's overall stats
  UPDATE inspections
  SET
    total_sample_size = total_samples,
    overall_defect_rate = CASE
      WHEN total_samples > 0 THEN (total_defects::DECIMAL / total_samples * 100)
      ELSE 0
    END
  WHERE id = COALESCE(NEW.inspection_id, OLD.inspection_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_overall_rate_on_line_item_change
  AFTER INSERT OR UPDATE OR DELETE ON inspection_line_items
  FOR EACH ROW EXECUTE FUNCTION update_inspection_overall_rate();

-- Update PO inspection status when inspection status changes
CREATE OR REPLACE FUNCTION update_po_inspection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the PO's inspection fields
  UPDATE purchase_orders
  SET
    inspection_id = NEW.id,
    inspection_status = NEW.status::TEXT
  WHERE id = NEW.purchase_order_id;

  -- If passed, update PO to ready-to-ship (if not already shipped)
  IF NEW.status = 'passed' AND OLD.status != 'passed' THEN
    UPDATE purchase_orders
    SET status = 'ready-to-ship'
    WHERE id = NEW.purchase_order_id
      AND status NOT IN ('shipped', 'delivered', 'cancelled');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_po_on_inspection_change
  AFTER INSERT OR UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_po_inspection_status();

-- -----------------------------------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------------------------------

ALTER TABLE inspection_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rework_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_message_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (full access)
CREATE POLICY "Authenticated users can manage inspection agents"
  ON inspection_agents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspections"
  ON inspections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection line items"
  ON inspection_line_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection defects"
  ON inspection_defects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection measurements"
  ON inspection_measurements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection photos"
  ON inspection_photos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage rework requests"
  ON rework_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection messages"
  ON inspection_messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage inspection message attachments"
  ON inspection_message_attachments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon policies for magic link access
CREATE POLICY "Anon can view inspections via magic link"
  ON inspections FOR SELECT
  TO anon
  USING (
    magic_link_token IS NOT NULL
    AND magic_link_expires_at > NOW()
  );

CREATE POLICY "Anon can update inspections via magic link"
  ON inspections FOR UPDATE
  TO anon
  USING (
    magic_link_token IS NOT NULL
    AND magic_link_expires_at > NOW()
  )
  WITH CHECK (
    magic_link_token IS NOT NULL
    AND magic_link_expires_at > NOW()
  );

CREATE POLICY "Anon can view inspection line items for magic link inspections"
  ON inspection_line_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspections.id = inspection_line_items.inspection_id
        AND magic_link_token IS NOT NULL
        AND magic_link_expires_at > NOW()
    )
  );

CREATE POLICY "Anon can insert inspection messages via magic link"
  ON inspection_messages FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspections.id = inspection_messages.inspection_id
        AND magic_link_token IS NOT NULL
        AND magic_link_expires_at > NOW()
    )
  );

CREATE POLICY "Anon can view inspection messages for magic link inspections"
  ON inspection_messages FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE inspections.id = inspection_messages.inspection_id
        AND magic_link_token IS NOT NULL
        AND magic_link_expires_at > NOW()
    )
  );

-- -----------------------------------------------------------------------------
-- Summary View
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW inspection_summary AS
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
  COUNT(*) FILTER (WHERE status = 'pending-confirmation') AS pending_confirmation,
  COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid,
  COUNT(*) FILTER (WHERE status = 'in-progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'report-submitted') AS report_submitted,
  COUNT(*) FILTER (WHERE status = 'passed') AS passed,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'pending-rework') AS pending_rework,
  COUNT(*) FILTER (WHERE status = 're-inspection') AS re_inspection,
  COALESCE(AVG(overall_defect_rate) FILTER (WHERE result != 'pending'), 0) AS avg_defect_rate
FROM inspections;

-- Grant access to the view
GRANT SELECT ON inspection_summary TO authenticated;
GRANT SELECT ON inspection_summary TO anon;

-- -----------------------------------------------------------------------------
-- Storage bucket for inspection photos
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload inspection photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'inspection-photos');

CREATE POLICY "Authenticated users can update inspection photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Authenticated users can delete inspection photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "Anyone can view inspection photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'inspection-photos');

-- Anon can upload via magic link
CREATE POLICY "Anon can upload inspection photos"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'inspection-photos');
