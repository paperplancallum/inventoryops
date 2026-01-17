-- =============================================================================
-- Activity Log: Comprehensive Audit Trail System
-- =============================================================================
-- Tracks all changes across the system with field-level change details
-- Supports filtering by entity type, action type, user, and date range

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE activity_entity_type AS ENUM (
  'product',
  'supplier',
  'purchase_order',
  'batch',
  'transfer',
  'inspection',
  'location',
  'invoice',
  'payment',
  'brand',
  'shipping_agent',
  'setting'
);

CREATE TYPE activity_action_type AS ENUM (
  'create',
  'update',
  'delete',
  'status_change'
);

-- =============================================================================
-- Activity Log Table
-- =============================================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- When
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Who
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT, -- Denormalized for display
  user_email TEXT, -- Denormalized for display
  is_system_action BOOLEAN NOT NULL DEFAULT FALSE, -- True for automated/trigger actions

  -- What entity
  entity_type activity_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL, -- Display name (e.g., "PO-2024-001", "Widget Pro")

  -- What action
  action activity_action_type NOT NULL,

  -- Field-level changes (JSONB array)
  -- Each element: { field, fieldLabel, oldValue, newValue, valueType }
  changes JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  notes TEXT DEFAULT '',

  -- For linking related changes (e.g., batch split creates 2 entries)
  correlation_id UUID
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_is_system ON activity_log(is_system_action);

-- Composite index for common query patterns
CREATE INDEX idx_activity_log_type_action ON activity_log(entity_type, action);
CREATE INDEX idx_activity_log_user_date ON activity_log(user_id, created_at DESC);

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view activity log
CREATE POLICY "Users can view activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (true);

-- Only allow inserts via triggers/functions (service role)
CREATE POLICY "System can insert activity log"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- Helper: Get Current User Info
-- =============================================================================

CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_name TEXT, user_email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid(),
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'Unknown'
    )::TEXT,
    COALESCE(
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      ''
    )::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Helper: Detect Field Changes
-- =============================================================================

CREATE OR REPLACE FUNCTION detect_field_changes(
  p_old JSONB,
  p_new JSONB,
  p_field_config JSONB -- Array of { field, label, valueType }
)
RETURNS JSONB AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_field RECORD;
  v_old_val JSONB;
  v_new_val JSONB;
BEGIN
  FOR v_field IN SELECT * FROM jsonb_array_elements(p_field_config) AS f(config)
  LOOP
    v_old_val := p_old->(v_field.config->>'field');
    v_new_val := p_new->(v_field.config->>'field');

    -- Compare values (handle nulls)
    IF (v_old_val IS DISTINCT FROM v_new_val) THEN
      v_changes := v_changes || jsonb_build_object(
        'field', v_field.config->>'field',
        'fieldLabel', v_field.config->>'label',
        'oldValue', v_old_val,
        'newValue', v_new_val,
        'valueType', COALESCE(v_field.config->>'valueType', 'text')
      );
    END IF;
  END LOOP;

  RETURN v_changes;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Generic Activity Logging Function
-- =============================================================================

CREATE OR REPLACE FUNCTION log_activity(
  p_entity_type activity_entity_type,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_action activity_action_type,
  p_changes JSONB DEFAULT '[]'::JSONB,
  p_notes TEXT DEFAULT '',
  p_is_system BOOLEAN DEFAULT FALSE,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_info RECORD;
  v_activity_id UUID;
BEGIN
  SELECT * INTO v_user_info FROM get_current_user_info();

  INSERT INTO activity_log (
    user_id,
    user_name,
    user_email,
    is_system_action,
    entity_type,
    entity_id,
    entity_name,
    action,
    changes,
    notes,
    correlation_id
  ) VALUES (
    v_user_info.user_id,
    v_user_info.user_name,
    v_user_info.user_email,
    p_is_system OR (v_user_info.user_id IS NULL),
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action,
    p_changes,
    p_notes,
    p_correlation_id
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PRODUCTS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_product_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "name", "label": "Name", "valueType": "text"},
    {"field": "sku", "label": "SKU", "valueType": "text"},
    {"field": "asin", "label": "ASIN", "valueType": "text"},
    {"field": "fnsku", "label": "FNSKU", "valueType": "text"},
    {"field": "upc", "label": "UPC", "valueType": "text"},
    {"field": "category", "label": "Category", "valueType": "text"},
    {"field": "unit_cost", "label": "Unit Cost", "valueType": "currency"},
    {"field": "wholesale_price", "label": "Wholesale Price", "valueType": "currency"},
    {"field": "retail_price", "label": "Retail Price", "valueType": "currency"},
    {"field": "case_quantity", "label": "Case Quantity", "valueType": "number"},
    {"field": "weight_lbs", "label": "Weight (lbs)", "valueType": "number"},
    {"field": "is_active", "label": "Active", "valueType": "boolean"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.name;
    PERFORM log_activity('product', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.name;
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    -- Only log if something actually changed
    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('product', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.name;
    PERFORM log_activity('product', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_product_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_product_changes();

-- =============================================================================
-- SUPPLIERS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_supplier_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "name", "label": "Name", "valueType": "text"},
    {"field": "code", "label": "Code", "valueType": "text"},
    {"field": "contact_name", "label": "Contact Name", "valueType": "text"},
    {"field": "contact_email", "label": "Contact Email", "valueType": "text"},
    {"field": "contact_phone", "label": "Contact Phone", "valueType": "text"},
    {"field": "address", "label": "Address", "valueType": "text"},
    {"field": "country", "label": "Country", "valueType": "text"},
    {"field": "payment_terms", "label": "Payment Terms", "valueType": "text"},
    {"field": "lead_time_days", "label": "Lead Time (days)", "valueType": "number"},
    {"field": "is_active", "label": "Active", "valueType": "boolean"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.name;
    PERFORM log_activity('supplier', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.name;
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('supplier', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.name;
    PERFORM log_activity('supplier', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_supplier_changes
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION log_supplier_changes();

-- =============================================================================
-- PURCHASE_ORDERS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_purchase_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "status", "label": "Status", "valueType": "status"},
    {"field": "order_date", "label": "Order Date", "valueType": "date"},
    {"field": "expected_date", "label": "Expected Date", "valueType": "date"},
    {"field": "ship_date", "label": "Ship Date", "valueType": "date"},
    {"field": "total", "label": "Total", "valueType": "currency"},
    {"field": "currency", "label": "Currency", "valueType": "text"},
    {"field": "payment_terms", "label": "Payment Terms", "valueType": "text"},
    {"field": "shipping_method", "label": "Shipping Method", "valueType": "text"},
    {"field": "notes", "label": "Notes", "valueType": "text"},
    {"field": "internal_notes", "label": "Internal Notes", "valueType": "text"},
    {"field": "production_complete_date", "label": "Production Complete", "valueType": "date"},
    {"field": "ready_to_ship_date", "label": "Ready to Ship", "valueType": "date"},
    {"field": "inspection_status", "label": "Inspection Status", "valueType": "status"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.po_number;
    PERFORM log_activity('purchase_order', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.po_number;

    -- Check for status change specifically
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'status_change';
      v_changes := jsonb_build_array(jsonb_build_object(
        'field', 'status',
        'fieldLabel', 'Status',
        'oldValue', OLD.status,
        'newValue', NEW.status,
        'valueType', 'status'
      ));
      PERFORM log_activity('purchase_order', NEW.id, v_entity_name, v_action, v_changes);
    ELSE
      v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

      IF jsonb_array_length(v_changes) > 0 THEN
        v_action := 'update';
        PERFORM log_activity('purchase_order', NEW.id, v_entity_name, v_action, v_changes);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.po_number;
    PERFORM log_activity('purchase_order', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_purchase_order_changes
  AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION log_purchase_order_changes();

-- =============================================================================
-- BATCHES Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_batch_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "stage", "label": "Stage", "valueType": "status"},
    {"field": "quantity", "label": "Quantity", "valueType": "number"},
    {"field": "unit_cost", "label": "Unit Cost", "valueType": "currency"},
    {"field": "total_cost", "label": "Total Cost", "valueType": "currency"},
    {"field": "expected_arrival", "label": "Expected Arrival", "valueType": "date"},
    {"field": "actual_arrival", "label": "Actual Arrival", "valueType": "date"},
    {"field": "location_id", "label": "Location", "valueType": "reference"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.batch_number;
    PERFORM log_activity('batch', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.batch_number;

    -- Check for stage change specifically
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      v_action := 'status_change';
      v_changes := jsonb_build_array(jsonb_build_object(
        'field', 'stage',
        'fieldLabel', 'Stage',
        'oldValue', OLD.stage,
        'newValue', NEW.stage,
        'valueType', 'status'
      ));
      PERFORM log_activity('batch', NEW.id, v_entity_name, v_action, v_changes);
    ELSE
      v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

      IF jsonb_array_length(v_changes) > 0 THEN
        v_action := 'update';
        PERFORM log_activity('batch', NEW.id, v_entity_name, v_action, v_changes);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.batch_number;
    PERFORM log_activity('batch', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_batch_changes
  AFTER INSERT OR UPDATE OR DELETE ON batches
  FOR EACH ROW EXECUTE FUNCTION log_batch_changes();

-- =============================================================================
-- TRANSFERS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_transfer_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "status", "label": "Status", "valueType": "status"},
    {"field": "transfer_type", "label": "Transfer Type", "valueType": "text"},
    {"field": "scheduled_pickup_date", "label": "Scheduled Pickup", "valueType": "date"},
    {"field": "actual_pickup_date", "label": "Actual Pickup", "valueType": "date"},
    {"field": "scheduled_delivery_date", "label": "Scheduled Delivery", "valueType": "date"},
    {"field": "actual_delivery_date", "label": "Actual Delivery", "valueType": "date"},
    {"field": "total_units", "label": "Total Units", "valueType": "number"},
    {"field": "total_cartons", "label": "Total Cartons", "valueType": "number"},
    {"field": "total_cbm", "label": "Total CBM", "valueType": "number"},
    {"field": "total_weight_kg", "label": "Total Weight (kg)", "valueType": "number"},
    {"field": "shipping_cost", "label": "Shipping Cost", "valueType": "currency"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.transfer_number;
    PERFORM log_activity('transfer', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.transfer_number;

    -- Check for status change specifically
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'status_change';
      v_changes := jsonb_build_array(jsonb_build_object(
        'field', 'status',
        'fieldLabel', 'Status',
        'oldValue', OLD.status,
        'newValue', NEW.status,
        'valueType', 'status'
      ));
      PERFORM log_activity('transfer', NEW.id, v_entity_name, v_action, v_changes);
    ELSE
      v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

      IF jsonb_array_length(v_changes) > 0 THEN
        v_action := 'update';
        PERFORM log_activity('transfer', NEW.id, v_entity_name, v_action, v_changes);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.transfer_number;
    PERFORM log_activity('transfer', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_transfer_changes
  AFTER INSERT OR UPDATE OR DELETE ON transfers
  FOR EACH ROW EXECUTE FUNCTION log_transfer_changes();

-- =============================================================================
-- INSPECTIONS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_inspection_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "status", "label": "Status", "valueType": "status"},
    {"field": "result", "label": "Result", "valueType": "status"},
    {"field": "scheduled_date", "label": "Scheduled Date", "valueType": "date"},
    {"field": "completed_date", "label": "Completed Date", "valueType": "date"},
    {"field": "total_quantity", "label": "Total Quantity", "valueType": "number"},
    {"field": "passed_quantity", "label": "Passed Quantity", "valueType": "number"},
    {"field": "failed_quantity", "label": "Failed Quantity", "valueType": "number"},
    {"field": "defect_rate", "label": "Defect Rate", "valueType": "number"},
    {"field": "aql_level", "label": "AQL Level", "valueType": "text"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.inspection_number;
    PERFORM log_activity('inspection', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.inspection_number;

    -- Check for status/result change specifically
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.result IS DISTINCT FROM NEW.result THEN
      v_action := 'status_change';
      v_changes := '[]'::JSONB;

      IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_changes := v_changes || jsonb_build_object(
          'field', 'status',
          'fieldLabel', 'Status',
          'oldValue', OLD.status,
          'newValue', NEW.status,
          'valueType', 'status'
        );
      END IF;

      IF OLD.result IS DISTINCT FROM NEW.result THEN
        v_changes := v_changes || jsonb_build_object(
          'field', 'result',
          'fieldLabel', 'Result',
          'oldValue', OLD.result,
          'newValue', NEW.result,
          'valueType', 'status'
        );
      END IF;

      PERFORM log_activity('inspection', NEW.id, v_entity_name, v_action, v_changes);
    ELSE
      v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

      IF jsonb_array_length(v_changes) > 0 THEN
        v_action := 'update';
        PERFORM log_activity('inspection', NEW.id, v_entity_name, v_action, v_changes);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.inspection_number;
    PERFORM log_activity('inspection', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_inspection_changes
  AFTER INSERT OR UPDATE OR DELETE ON inspections
  FOR EACH ROW EXECUTE FUNCTION log_inspection_changes();

-- =============================================================================
-- LOCATIONS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_location_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "name", "label": "Name", "valueType": "text"},
    {"field": "code", "label": "Code", "valueType": "text"},
    {"field": "type", "label": "Type", "valueType": "text"},
    {"field": "address", "label": "Address", "valueType": "text"},
    {"field": "city", "label": "City", "valueType": "text"},
    {"field": "country", "label": "Country", "valueType": "text"},
    {"field": "contact_name", "label": "Contact Name", "valueType": "text"},
    {"field": "contact_email", "label": "Contact Email", "valueType": "text"},
    {"field": "contact_phone", "label": "Contact Phone", "valueType": "text"},
    {"field": "is_active", "label": "Active", "valueType": "boolean"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.name;
    PERFORM log_activity('location', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.name;
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('location', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.name;
    PERFORM log_activity('location', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_location_changes
  AFTER INSERT OR UPDATE OR DELETE ON locations
  FOR EACH ROW EXECUTE FUNCTION log_location_changes();

-- =============================================================================
-- INVOICES Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_invoice_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "status", "label": "Status", "valueType": "status"},
    {"field": "invoice_type", "label": "Invoice Type", "valueType": "text"},
    {"field": "amount", "label": "Amount", "valueType": "currency"},
    {"field": "amount_paid", "label": "Amount Paid", "valueType": "currency"},
    {"field": "due_date", "label": "Due Date", "valueType": "date"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.invoice_number;
    PERFORM log_activity('invoice', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.invoice_number;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := 'status_change';
      v_changes := jsonb_build_array(jsonb_build_object(
        'field', 'status',
        'fieldLabel', 'Status',
        'oldValue', OLD.status,
        'newValue', NEW.status,
        'valueType', 'status'
      ));
      PERFORM log_activity('invoice', NEW.id, v_entity_name, v_action, v_changes);
    ELSE
      v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

      IF jsonb_array_length(v_changes) > 0 THEN
        v_action := 'update';
        PERFORM log_activity('invoice', NEW.id, v_entity_name, v_action, v_changes);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.invoice_number;
    PERFORM log_activity('invoice', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_invoice_changes
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_invoice_changes();

-- =============================================================================
-- INVOICE_PAYMENTS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_payment_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_invoice_number TEXT;
  v_field_config JSONB := '[
    {"field": "amount", "label": "Amount", "valueType": "currency"},
    {"field": "payment_date", "label": "Payment Date", "valueType": "date"},
    {"field": "payment_method", "label": "Payment Method", "valueType": "text"},
    {"field": "reference_number", "label": "Reference Number", "valueType": "text"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  -- Get invoice number for display
  SELECT invoice_number INTO v_invoice_number
  FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := 'Payment for ' || COALESCE(v_invoice_number, 'Unknown');
    PERFORM log_activity('payment', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := 'Payment for ' || COALESCE(v_invoice_number, 'Unknown');
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('payment', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := 'Payment for ' || COALESCE(v_invoice_number, 'Unknown');
    PERFORM log_activity('payment', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_payment_changes
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION log_payment_changes();

-- =============================================================================
-- BRANDS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_brand_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "name", "label": "Name", "valueType": "text"},
    {"field": "description", "label": "Description", "valueType": "text"},
    {"field": "is_active", "label": "Active", "valueType": "boolean"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.name;
    PERFORM log_activity('brand', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.name;
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('brand', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.name;
    PERFORM log_activity('brand', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_brand_changes
  AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION log_brand_changes();

-- =============================================================================
-- SHIPPING_AGENTS Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION log_shipping_agent_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB := '[]'::JSONB;
  v_action activity_action_type;
  v_entity_name TEXT;
  v_field_config JSONB := '[
    {"field": "name", "label": "Name", "valueType": "text"},
    {"field": "company", "label": "Company", "valueType": "text"},
    {"field": "email", "label": "Email", "valueType": "text"},
    {"field": "phone", "label": "Phone", "valueType": "text"},
    {"field": "specialties", "label": "Specialties", "valueType": "text"},
    {"field": "is_active", "label": "Active", "valueType": "boolean"},
    {"field": "notes", "label": "Notes", "valueType": "text"}
  ]'::JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_entity_name := NEW.name;
    PERFORM log_activity('shipping_agent', NEW.id, v_entity_name, v_action);

  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_name := NEW.name;
    v_changes := detect_field_changes(to_jsonb(OLD), to_jsonb(NEW), v_field_config);

    IF jsonb_array_length(v_changes) > 0 THEN
      v_action := 'update';
      PERFORM log_activity('shipping_agent', NEW.id, v_entity_name, v_action, v_changes);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_entity_name := OLD.name;
    PERFORM log_activity('shipping_agent', OLD.id, v_entity_name, v_action);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_shipping_agent_changes
  AFTER INSERT OR UPDATE OR DELETE ON shipping_agents
  FOR EACH ROW EXECUTE FUNCTION log_shipping_agent_changes();

-- =============================================================================
-- Grant anon access for public data (if needed)
-- =============================================================================

GRANT SELECT ON activity_log TO anon;
