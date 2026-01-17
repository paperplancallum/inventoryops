-- Temporary anon access for Amazon tables (for development/testing)
-- Remove these policies in production!

CREATE POLICY "Anon can view amazon_connections"
  ON amazon_connections FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert amazon_connections"
  ON amazon_connections FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update amazon_connections"
  ON amazon_connections FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon can view amazon_inventory"
  ON amazon_inventory FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert amazon_inventory"
  ON amazon_inventory FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update amazon_inventory"
  ON amazon_inventory FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon can view amazon_sku_mappings"
  ON amazon_sku_mappings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can view amazon_reconciliations"
  ON amazon_reconciliations FOR SELECT
  TO anon
  USING (true);
