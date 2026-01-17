-- Add expense items table for BOM non-component costs (processing fees, kitting fees, etc.)

CREATE TABLE IF NOT EXISTS bom_expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_per_unit BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for BOM lookup
CREATE INDEX IF NOT EXISTS idx_bom_expense_items_bom_id ON bom_expense_items(bom_id);

-- Enable RLS
ALTER TABLE bom_expense_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as bom_line_items)
CREATE POLICY "Authenticated users can view bom_expense_items"
  ON bom_expense_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bom_expense_items"
  ON bom_expense_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bom_expense_items"
  ON bom_expense_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bom_expense_items"
  ON bom_expense_items FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER set_bom_expense_items_updated_at
  BEFORE UPDATE ON bom_expense_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
