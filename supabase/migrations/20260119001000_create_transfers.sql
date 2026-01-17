-- Transfers Migration
-- Creates tables for inventory transfer tracking, shipping agents, and Amazon shipments

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Transfer status enum
CREATE TYPE transfer_status AS ENUM (
  'draft',
  'booked',
  'in-transit',
  'delivered',
  'completed',
  'cancelled'
);

-- Shipping method enum
CREATE TYPE shipping_method AS ENUM (
  'ocean-fcl',
  'ocean-lcl',
  'air-freight',
  'air-express',
  'ground',
  'rail',
  'courier'
);

-- Transfer document type enum
CREATE TYPE transfer_document_type AS ENUM (
  'bill-of-lading',
  'proof-of-delivery',
  'customs-form',
  'commercial-invoice',
  'packing-list',
  'certificate-of-origin',
  'insurance-certificate',
  'shipping-manifest',
  'other'
);

-- Customs status enum
CREATE TYPE customs_status AS ENUM (
  'pending',
  'in-progress',
  'cleared',
  'held'
);

-- Amazon receiving status enum
CREATE TYPE amazon_receiving_status AS ENUM (
  'checked-in',
  'receiving',
  'received',
  'closed'
);

-- Shipping service type enum
CREATE TYPE shipping_service AS ENUM (
  'ocean',
  'air',
  'trucking',
  'rail',
  'courier'
);

-- Transfer line item status enum
CREATE TYPE transfer_line_item_status AS ENUM (
  'pending',
  'in_transit',
  'received',
  'partial',
  'cancelled'
);

-- Amazon shipment status enum
CREATE TYPE amazon_shipment_status AS ENUM (
  'WORKING',
  'READY_TO_SHIP',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'CHECKED_IN',
  'RECEIVING',
  'CLOSED',
  'CANCELLED',
  'DELETED',
  'ERROR'
);

-- Amazon shipment type enum
CREATE TYPE amazon_shipment_type AS ENUM (
  'SP',
  'LTL',
  'FTL'
);

-- Amazon inbound type enum
CREATE TYPE amazon_inbound_type AS ENUM (
  'FBA',
  'AWD'
);

-- =============================================================================
-- TRANSFER NUMBER SEQUENCE
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  next_seq := nextval('transfer_number_seq');
  RETURN 'TRF-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SHIPPING AGENTS TABLE
-- =============================================================================

CREATE TABLE shipping_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  services shipping_service[] NOT NULL DEFAULT '{}',

  -- Address
  address_street TEXT,
  address_city TEXT NOT NULL,
  address_state TEXT,
  address_country TEXT NOT NULL,
  address_postal_code TEXT,

  -- Account info
  account_number TEXT,
  website TEXT,
  notes TEXT,

  -- Payment terms
  payment_terms TEXT,
  payment_terms_template_id UUID REFERENCES payment_terms_templates(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipping agent messages
CREATE TABLE shipping_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipping_agent_id UUID NOT NULL REFERENCES shipping_agents(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound', 'note')),
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message attachments
CREATE TABLE shipping_agent_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES shipping_agent_messages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRANSFERS TABLE
-- =============================================================================

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT NOT NULL UNIQUE DEFAULT generate_transfer_number(),
  status transfer_status NOT NULL DEFAULT 'draft',

  -- Locations
  source_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  -- Shipping agent (optional)
  shipping_agent_id UUID REFERENCES shipping_agents(id) ON DELETE SET NULL,

  -- Carrier info
  carrier TEXT,
  carrier_account_number TEXT,
  shipping_method shipping_method,

  -- Container numbers (for ocean freight)
  container_numbers TEXT[] NOT NULL DEFAULT '{}',

  -- Dates
  scheduled_departure_date DATE,
  actual_departure_date DATE,
  scheduled_arrival_date DATE,
  actual_arrival_date DATE,

  -- Incoterms
  incoterms TEXT,

  -- Costs (itemized)
  cost_freight DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_insurance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_duties DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_taxes DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_handling DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_other DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cost_currency TEXT NOT NULL DEFAULT 'USD',

  -- Computed total cost
  total_cost DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (
    cost_freight + cost_insurance + cost_duties + cost_taxes + cost_handling + cost_other
  ) STORED,

  -- Customs info
  customs_hs_code TEXT,
  customs_broker TEXT,
  customs_status customs_status NOT NULL DEFAULT 'pending',
  customs_entry_number TEXT,
  customs_clearance_date DATE,
  customs_notes TEXT,

  -- Amazon receiving (for FBA/AWD destinations)
  amazon_receiving_status amazon_receiving_status,
  amazon_checked_in_date TIMESTAMPTZ,
  amazon_receiving_started_date TIMESTAMPTZ,
  amazon_received_date TIMESTAMPTZ,
  amazon_closed_date TIMESTAMPTZ,
  amazon_discrepancy INT DEFAULT 0,
  amazon_receiving_notes TEXT,

  -- Amazon shipment link
  amazon_shipment_id TEXT,

  -- Notes
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRANSFER LINE ITEMS TABLE
-- =============================================================================

CREATE TABLE transfer_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,

  -- Source batch/stock
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,

  -- Quantity
  quantity INT NOT NULL CHECK (quantity > 0),

  -- Cost (from batch)
  unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Status
  status transfer_line_item_status NOT NULL DEFAULT 'pending',

  -- Receiving info
  received_quantity INT,
  discrepancy INT,
  received_at TIMESTAMPTZ,
  received_notes TEXT,

  -- Stock ledger entry references
  debit_ledger_entry_id UUID,
  credit_ledger_entry_id UUID,

  -- Sort order
  sort_order INT NOT NULL DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRANSFER TRACKING NUMBERS TABLE
-- =============================================================================

CREATE TABLE transfer_tracking_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRANSFER DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE transfer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  document_type transfer_document_type NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  size INT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TRANSFER STATUS HISTORY TABLE
-- =============================================================================

CREATE TABLE transfer_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  status transfer_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AMAZON SHIPMENTS TABLE (SP-API sync)
-- =============================================================================

CREATE TABLE amazon_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Amazon identifiers
  shipment_id TEXT NOT NULL UNIQUE,
  shipment_confirmation_id TEXT,
  shipment_name TEXT NOT NULL,

  -- Type
  inbound_type amazon_inbound_type NOT NULL DEFAULT 'FBA',

  -- Status
  status amazon_shipment_status NOT NULL,

  -- Dates
  created_date DATE NOT NULL,
  last_updated_date DATE NOT NULL,

  -- Destination
  destination_fc_id TEXT NOT NULL,
  destination_address_name TEXT,
  destination_address_line1 TEXT,
  destination_address_city TEXT,
  destination_address_state TEXT,
  destination_address_postal_code TEXT,
  destination_address_country TEXT,

  -- Shipping details
  shipment_type amazon_shipment_type,
  carrier_name TEXT,
  tracking_ids TEXT[] DEFAULT '{}',

  -- Box info
  box_count INT DEFAULT 0,
  estimated_box_contents_fee DECIMAL(10, 2),

  -- Delivery window (LTL/FTL)
  delivery_window_start TIMESTAMPTZ,
  delivery_window_end TIMESTAMPTZ,
  freight_ready_date DATE,

  -- Labels
  labels_prep_type TEXT,
  are_cases_required BOOLEAN DEFAULT false,

  -- Totals
  total_units INT NOT NULL DEFAULT 0,
  total_skus INT NOT NULL DEFAULT 0,

  -- Link to internal transfer
  linked_transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Amazon shipment items
CREATE TABLE amazon_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amazon_shipment_id UUID NOT NULL REFERENCES amazon_shipments(id) ON DELETE CASCADE,

  -- SKU info
  seller_sku TEXT NOT NULL,
  fn_sku TEXT NOT NULL,
  asin TEXT,
  product_name TEXT NOT NULL,

  -- Quantities
  quantity_shipped INT NOT NULL DEFAULT 0,
  quantity_received INT NOT NULL DEFAULT 0,
  quantity_in_case INT,

  -- Prep details
  prep_details TEXT[] DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Shipping agents
CREATE INDEX idx_shipping_agents_active ON shipping_agents(is_active);
CREATE INDEX idx_shipping_agent_messages_agent ON shipping_agent_messages(shipping_agent_id);
CREATE INDEX idx_shipping_agent_messages_unread ON shipping_agent_messages(shipping_agent_id) WHERE is_read = false;

-- Transfers
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_source ON transfers(source_location_id);
CREATE INDEX idx_transfers_destination ON transfers(destination_location_id);
CREATE INDEX idx_transfers_shipping_agent ON transfers(shipping_agent_id);
CREATE INDEX idx_transfers_scheduled_departure ON transfers(scheduled_departure_date);
CREATE INDEX idx_transfers_scheduled_arrival ON transfers(scheduled_arrival_date);
CREATE INDEX idx_transfers_amazon_shipment ON transfers(amazon_shipment_id);
CREATE INDEX idx_transfers_created_at ON transfers(created_at);

-- Transfer line items
CREATE INDEX idx_transfer_line_items_transfer ON transfer_line_items(transfer_id);
CREATE INDEX idx_transfer_line_items_batch ON transfer_line_items(batch_id);
CREATE INDEX idx_transfer_line_items_status ON transfer_line_items(status);

-- Tracking numbers
CREATE INDEX idx_transfer_tracking_transfer ON transfer_tracking_numbers(transfer_id);

-- Documents
CREATE INDEX idx_transfer_documents_transfer ON transfer_documents(transfer_id);
CREATE INDEX idx_transfer_documents_type ON transfer_documents(document_type);

-- Status history
CREATE INDEX idx_transfer_status_history_transfer ON transfer_status_history(transfer_id);
CREATE INDEX idx_transfer_status_history_created ON transfer_status_history(created_at);

-- Amazon shipments
CREATE INDEX idx_amazon_shipments_status ON amazon_shipments(status);
CREATE INDEX idx_amazon_shipments_linked_transfer ON amazon_shipments(linked_transfer_id);
CREATE INDEX idx_amazon_shipment_items_shipment ON amazon_shipment_items(amazon_shipment_id);
CREATE INDEX idx_amazon_shipment_items_sku ON amazon_shipment_items(seller_sku);

-- =============================================================================
-- TRIGGERS - Auto-update timestamps
-- =============================================================================

CREATE TRIGGER transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER transfer_line_items_updated_at
  BEFORE UPDATE ON transfer_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER shipping_agents_updated_at
  BEFORE UPDATE ON shipping_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER amazon_shipments_updated_at
  BEFORE UPDATE ON amazon_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER amazon_shipment_items_updated_at
  BEFORE UPDATE ON amazon_shipment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGERS - Record transfer status history
-- =============================================================================

CREATE OR REPLACE FUNCTION record_transfer_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO transfer_status_history (transfer_id, status, note)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_status_change_trigger
  AFTER UPDATE ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION record_transfer_status_change();

-- Record initial status on insert
CREATE OR REPLACE FUNCTION record_transfer_initial_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO transfer_status_history (transfer_id, status, note)
  VALUES (NEW.id, NEW.status, 'Transfer created');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_initial_status_trigger
  AFTER INSERT ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION record_transfer_initial_status();

-- =============================================================================
-- FUNCTION - Validate transfer status transition
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_transfer_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  valid_transitions JSONB := '{
    "draft": ["booked", "cancelled"],
    "booked": ["in-transit", "cancelled"],
    "in-transit": ["delivered", "cancelled"],
    "delivered": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
  }'::JSONB;
  allowed_statuses JSONB;
BEGIN
  -- Skip if status unchanged
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions for current status
  allowed_statuses := valid_transitions -> OLD.status::TEXT;

  -- Check if new status is allowed
  IF NOT (allowed_statuses ? NEW.status::TEXT) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_status_transition_trigger
  BEFORE UPDATE OF status ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION validate_transfer_status_transition();

-- =============================================================================
-- FUNCTION - Create stock ledger entries when transfer status changes
-- =============================================================================

CREATE OR REPLACE FUNCTION process_transfer_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_line_item RECORD;
  v_debit_entry_id UUID;
  v_credit_entry_id UUID;
  v_source_location_name TEXT;
  v_dest_location_name TEXT;
BEGIN
  -- Get location names
  SELECT name INTO v_source_location_name FROM locations WHERE id = NEW.source_location_id;
  SELECT name INTO v_dest_location_name FROM locations WHERE id = NEW.destination_location_id;

  -- When status changes to 'booked' - create debit entries (reserve stock at source)
  IF OLD.status = 'draft' AND NEW.status = 'booked' THEN
    FOR v_line_item IN
      SELECT * FROM transfer_line_items WHERE transfer_id = NEW.id
    LOOP
      -- Create debit entry (negative quantity at source)
      INSERT INTO stock_ledger_entries (
        batch_id, sku, product_name, location_id, quantity,
        movement_type, unit_cost, transfer_id, transfer_line_item_id,
        reason, notes, created_by
      ) VALUES (
        v_line_item.batch_id,
        v_line_item.sku,
        v_line_item.product_name,
        NEW.source_location_id,
        -v_line_item.quantity,
        'transfer_out',
        v_line_item.unit_cost,
        NEW.id,
        v_line_item.id,
        'Transfer ' || NEW.transfer_number || ' booked',
        'Transferred to ' || v_dest_location_name,
        'system'
      ) RETURNING id INTO v_debit_entry_id;

      -- Update line item with debit entry reference
      UPDATE transfer_line_items
      SET debit_ledger_entry_id = v_debit_entry_id, status = 'in_transit'
      WHERE id = v_line_item.id;
    END LOOP;
  END IF;

  -- When status changes to 'completed' - create credit entries (add stock at destination)
  IF OLD.status = 'delivered' AND NEW.status = 'completed' THEN
    FOR v_line_item IN
      SELECT * FROM transfer_line_items WHERE transfer_id = NEW.id
    LOOP
      -- Use received quantity if available, otherwise use original quantity
      INSERT INTO stock_ledger_entries (
        batch_id, sku, product_name, location_id, quantity,
        movement_type, unit_cost, transfer_id, transfer_line_item_id,
        reason, notes, created_by
      ) VALUES (
        v_line_item.batch_id,
        v_line_item.sku,
        v_line_item.product_name,
        NEW.destination_location_id,
        COALESCE(v_line_item.received_quantity, v_line_item.quantity),
        'transfer_in',
        v_line_item.unit_cost,
        NEW.id,
        v_line_item.id,
        'Transfer ' || NEW.transfer_number || ' completed',
        'Received from ' || v_source_location_name,
        'system'
      ) RETURNING id INTO v_credit_entry_id;

      -- Update line item with credit entry reference and status
      UPDATE transfer_line_items
      SET
        credit_ledger_entry_id = v_credit_entry_id,
        status = CASE
          WHEN v_line_item.received_quantity IS NOT NULL AND v_line_item.received_quantity < v_line_item.quantity
          THEN 'partial'::transfer_line_item_status
          ELSE 'received'::transfer_line_item_status
        END,
        received_at = COALESCE(v_line_item.received_at, NOW())
      WHERE id = v_line_item.id;
    END LOOP;
  END IF;

  -- When cancelled - reverse debit entries if they exist
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR v_line_item IN
      SELECT * FROM transfer_line_items
      WHERE transfer_id = NEW.id AND debit_ledger_entry_id IS NOT NULL
    LOOP
      -- Create reversal entry (positive quantity back at source)
      INSERT INTO stock_ledger_entries (
        batch_id, sku, product_name, location_id, quantity,
        movement_type, unit_cost, transfer_id, transfer_line_item_id,
        reason, notes, created_by
      ) VALUES (
        v_line_item.batch_id,
        v_line_item.sku,
        v_line_item.product_name,
        NEW.source_location_id,
        v_line_item.quantity,
        'adjustment_add',
        v_line_item.unit_cost,
        NEW.id,
        v_line_item.id,
        'Transfer ' || NEW.transfer_number || ' cancelled',
        'Stock returned - transfer cancelled',
        'system'
      );

      -- Update line item status
      UPDATE transfer_line_items
      SET status = 'cancelled'
      WHERE id = v_line_item.id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_stock_movement_trigger
  AFTER UPDATE OF status ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION process_transfer_stock_movement();

-- =============================================================================
-- FUNCTION - Update batch stage based on transfer destination
-- =============================================================================

CREATE OR REPLACE FUNCTION update_batch_stage_on_transfer_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_line_item RECORD;
  v_dest_location_type location_type;
  v_new_stage batch_stage;
BEGIN
  -- Only process when status changes to 'completed'
  IF OLD.status = 'delivered' AND NEW.status = 'completed' THEN
    -- Get destination location type
    SELECT type INTO v_dest_location_type FROM locations WHERE id = NEW.destination_location_id;

    -- Determine new batch stage based on location type
    v_new_stage := CASE v_dest_location_type
      WHEN 'amazon-fba' THEN 'amazon'::batch_stage
      WHEN 'amazon-awd' THEN 'amazon'::batch_stage
      WHEN 'warehouse' THEN 'warehouse'::batch_stage
      WHEN '3pl' THEN 'warehouse'::batch_stage
      ELSE NULL
    END;

    -- Update batch stages if a mapping exists
    IF v_new_stage IS NOT NULL THEN
      FOR v_line_item IN
        SELECT batch_id FROM transfer_line_items WHERE transfer_id = NEW.id
      LOOP
        UPDATE batches SET stage = v_new_stage WHERE id = v_line_item.batch_id;
      END LOOP;
    END IF;
  END IF;

  -- When transfer goes to in-transit, update batch stage
  IF OLD.status = 'booked' AND NEW.status = 'in-transit' THEN
    FOR v_line_item IN
      SELECT batch_id FROM transfer_line_items WHERE transfer_id = NEW.id
    LOOP
      UPDATE batches SET stage = 'in-transit'::batch_stage WHERE id = v_line_item.batch_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_stage_on_transfer_trigger
  AFTER UPDATE OF status ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_stage_on_transfer_complete();

-- =============================================================================
-- FUNCTION - Validate stock availability before booking transfer
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_transfer_stock_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_line_item RECORD;
  v_available_stock BIGINT;
BEGIN
  -- Only validate when changing to 'booked' status
  IF NEW.status = 'booked' AND OLD.status = 'draft' THEN
    FOR v_line_item IN
      SELECT * FROM transfer_line_items WHERE transfer_id = NEW.id
    LOOP
      -- Get available stock at source location for this batch
      SELECT COALESCE(SUM(quantity), 0) INTO v_available_stock
      FROM stock_ledger_entries
      WHERE batch_id = v_line_item.batch_id
        AND location_id = NEW.source_location_id;

      -- Check if sufficient stock
      IF v_available_stock < v_line_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for % at source location. Available: %, Requested: %',
          v_line_item.sku, v_available_stock, v_line_item.quantity;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_stock_validation_trigger
  BEFORE UPDATE OF status ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION validate_transfer_stock_availability();

-- =============================================================================
-- VIEW - Transfer summary with location names
-- =============================================================================

CREATE VIEW transfer_summary AS
SELECT
  t.id,
  t.transfer_number,
  t.status,
  t.source_location_id,
  sl.name AS source_location_name,
  sl.type AS source_location_type,
  t.destination_location_id,
  dl.name AS destination_location_name,
  dl.type AS destination_location_type,
  t.shipping_agent_id,
  sa.name AS shipping_agent_name,
  t.carrier,
  t.shipping_method,
  t.scheduled_departure_date,
  t.actual_departure_date,
  t.scheduled_arrival_date,
  t.actual_arrival_date,
  t.total_cost,
  t.cost_currency,
  t.amazon_shipment_id,
  t.created_at,
  t.updated_at,
  -- Aggregated line item info
  COUNT(tli.id) AS line_item_count,
  COALESCE(SUM(tli.quantity), 0) AS total_units,
  COALESCE(SUM(tli.total_cost), 0) AS total_value
FROM transfers t
LEFT JOIN locations sl ON sl.id = t.source_location_id
LEFT JOIN locations dl ON dl.id = t.destination_location_id
LEFT JOIN shipping_agents sa ON sa.id = t.shipping_agent_id
LEFT JOIN transfer_line_items tli ON tli.transfer_id = t.id
GROUP BY
  t.id, t.transfer_number, t.status, t.source_location_id, sl.name, sl.type,
  t.destination_location_id, dl.name, dl.type, t.shipping_agent_id, sa.name,
  t.carrier, t.shipping_method, t.scheduled_departure_date, t.actual_departure_date,
  t.scheduled_arrival_date, t.actual_arrival_date, t.total_cost, t.cost_currency,
  t.amazon_shipment_id, t.created_at, t.updated_at;

-- =============================================================================
-- VIEW - Available stock for transfers (from stock_by_location)
-- =============================================================================

CREATE VIEW available_stock_for_transfer AS
SELECT
  gen_random_uuid() AS id,
  sbl.batch_id,
  sbl.sku,
  sbl.product_name,
  sbl.location_id,
  sbl.location_name,
  sbl.total_quantity AS available_quantity,
  sbl.unit_cost,
  sbl.total_value,
  sbl.po_number,
  sbl.supplier_name
FROM stock_by_location sbl
WHERE sbl.total_quantity > 0;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_agent_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_tracking_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_shipment_items ENABLE ROW LEVEL SECURITY;

-- Shipping agents policies
CREATE POLICY "Authenticated users can view shipping_agents"
  ON shipping_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert shipping_agents"
  ON shipping_agents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shipping_agents"
  ON shipping_agents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete shipping_agents"
  ON shipping_agents FOR DELETE TO authenticated USING (true);

-- Shipping agent messages policies
CREATE POLICY "Authenticated users can view shipping_agent_messages"
  ON shipping_agent_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert shipping_agent_messages"
  ON shipping_agent_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shipping_agent_messages"
  ON shipping_agent_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete shipping_agent_messages"
  ON shipping_agent_messages FOR DELETE TO authenticated USING (true);

-- Message attachments policies
CREATE POLICY "Authenticated users can view shipping_agent_message_attachments"
  ON shipping_agent_message_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert shipping_agent_message_attachments"
  ON shipping_agent_message_attachments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete shipping_agent_message_attachments"
  ON shipping_agent_message_attachments FOR DELETE TO authenticated USING (true);

-- Transfers policies
CREATE POLICY "Authenticated users can view transfers"
  ON transfers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfers"
  ON transfers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transfers"
  ON transfers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete transfers"
  ON transfers FOR DELETE TO authenticated USING (true);

-- Transfer line items policies
CREATE POLICY "Authenticated users can view transfer_line_items"
  ON transfer_line_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfer_line_items"
  ON transfer_line_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transfer_line_items"
  ON transfer_line_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete transfer_line_items"
  ON transfer_line_items FOR DELETE TO authenticated USING (true);

-- Tracking numbers policies
CREATE POLICY "Authenticated users can view transfer_tracking_numbers"
  ON transfer_tracking_numbers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfer_tracking_numbers"
  ON transfer_tracking_numbers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete transfer_tracking_numbers"
  ON transfer_tracking_numbers FOR DELETE TO authenticated USING (true);

-- Documents policies
CREATE POLICY "Authenticated users can view transfer_documents"
  ON transfer_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfer_documents"
  ON transfer_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete transfer_documents"
  ON transfer_documents FOR DELETE TO authenticated USING (true);

-- Status history policies
CREATE POLICY "Authenticated users can view transfer_status_history"
  ON transfer_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transfer_status_history"
  ON transfer_status_history FOR INSERT TO authenticated WITH CHECK (true);

-- Amazon shipments policies
CREATE POLICY "Authenticated users can view amazon_shipments"
  ON amazon_shipments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert amazon_shipments"
  ON amazon_shipments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update amazon_shipments"
  ON amazon_shipments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete amazon_shipments"
  ON amazon_shipments FOR DELETE TO authenticated USING (true);

-- Amazon shipment items policies
CREATE POLICY "Authenticated users can view amazon_shipment_items"
  ON amazon_shipment_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert amazon_shipment_items"
  ON amazon_shipment_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update amazon_shipment_items"
  ON amazon_shipment_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete amazon_shipment_items"
  ON amazon_shipment_items FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- STORAGE BUCKET
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-documents', 'transfer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for transfer documents
CREATE POLICY "Authenticated users can upload transfer documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'transfer-documents');

CREATE POLICY "Authenticated users can view transfer documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'transfer-documents');

CREATE POLICY "Authenticated users can delete transfer documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'transfer-documents');

-- Storage bucket for shipping agent attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-agent-attachments', 'shipping-agent-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload shipping agent attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shipping-agent-attachments');

CREATE POLICY "Authenticated users can view shipping agent attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'shipping-agent-attachments');

CREATE POLICY "Authenticated users can delete shipping agent attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'shipping-agent-attachments');

-- =============================================================================
-- ADD FOREIGN KEY CONSTRAINT TO STOCK LEDGER
-- =============================================================================

-- Now that transfers table exists, add proper FK constraints
ALTER TABLE stock_ledger_entries
  ADD CONSTRAINT fk_stock_ledger_transfer
  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE SET NULL;

ALTER TABLE stock_ledger_entries
  ADD CONSTRAINT fk_stock_ledger_transfer_line_item
  FOREIGN KEY (transfer_line_item_id) REFERENCES transfer_line_items(id) ON DELETE SET NULL;
