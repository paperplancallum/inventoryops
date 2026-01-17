-- =============================================================================
-- Multi-PO Inspection Support
-- Allow one inspection to contain line items from multiple purchase orders
-- =============================================================================

-- Add inspection_number field (auto-incrementing display number)
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS inspection_number TEXT;

-- Make purchase_order_id nullable (we'll track POs via junction table)
ALTER TABLE inspections
ALTER COLUMN purchase_order_id DROP NOT NULL;

-- Make denormalized fields nullable too
ALTER TABLE inspections
ALTER COLUMN purchase_order_number DROP NOT NULL,
ALTER COLUMN supplier_name DROP NOT NULL;

-- Create junction table for inspection-to-PO relationships
CREATE TABLE IF NOT EXISTS inspection_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspection_id, purchase_order_id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_pos_inspection ON inspection_purchase_orders(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_pos_po ON inspection_purchase_orders(purchase_order_id);

-- Enable RLS
ALTER TABLE inspection_purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage inspection_purchase_orders"
  ON inspection_purchase_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate next inspection number
CREATE OR REPLACE FUNCTION generate_inspection_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  year_prefix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(
    CASE
      WHEN inspection_number ~ ('^INS-' || year_prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(inspection_number FROM 'INS-' || year_prefix || '-([0-9]+)$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM inspections;

  RETURN 'INS-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate inspection number
CREATE OR REPLACE FUNCTION set_inspection_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.inspection_number IS NULL THEN
    NEW.inspection_number := generate_inspection_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_inspection_number_trigger ON inspections;
CREATE TRIGGER set_inspection_number_trigger
  BEFORE INSERT ON inspections
  FOR EACH ROW EXECUTE FUNCTION set_inspection_number();

-- Update existing inspections to have inspection numbers
UPDATE inspections
SET inspection_number = numbered.new_number
FROM (
  SELECT id, 'INS-' || TO_CHAR(created_at, 'YY') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0') AS new_number
  FROM inspections
  WHERE inspection_number IS NULL
) AS numbered
WHERE inspections.id = numbered.id;

-- Update the PO inspection status trigger to handle multiple POs
CREATE OR REPLACE FUNCTION update_po_inspection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- For legacy single-PO inspections, update that PO
  IF NEW.purchase_order_id IS NOT NULL THEN
    UPDATE purchase_orders
    SET
      inspection_id = NEW.id,
      inspection_status = 'scheduled'::inspection_decision_status
    WHERE id = NEW.purchase_order_id;
  END IF;

  -- If inspection passed, update related POs to ready-to-ship
  IF NEW.status = 'passed' AND (OLD IS NULL OR OLD.status != 'passed') THEN
    -- Update single PO if set
    IF NEW.purchase_order_id IS NOT NULL THEN
      UPDATE purchase_orders
      SET status = 'ready-to-ship'
      WHERE id = NEW.purchase_order_id
        AND status NOT IN ('shipped', 'delivered', 'cancelled');
    END IF;

    -- Update POs via junction table
    UPDATE purchase_orders
    SET status = 'ready-to-ship'
    WHERE id IN (SELECT purchase_order_id FROM inspection_purchase_orders WHERE inspection_id = NEW.id)
      AND status NOT IN ('shipped', 'delivered', 'cancelled');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update PO status when adding to inspection via junction table
CREATE OR REPLACE FUNCTION update_po_on_inspection_link()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchase_orders
  SET
    inspection_id = NEW.inspection_id,
    inspection_status = 'scheduled'::inspection_decision_status
  WHERE id = NEW.purchase_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_po_on_inspection_link_trigger ON inspection_purchase_orders;
CREATE TRIGGER update_po_on_inspection_link_trigger
  AFTER INSERT ON inspection_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_po_on_inspection_link();
