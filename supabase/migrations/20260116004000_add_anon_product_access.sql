-- Allow anonymous users to view and manage products for development
-- This should be restricted in production

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert products"
  ON products FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete products"
  ON products FOR DELETE
  TO anon
  USING (true);

-- Also add for product_skus
CREATE POLICY "Anyone can view product_skus"
  ON product_skus FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert product_skus"
  ON product_skus FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update product_skus"
  ON product_skus FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete product_skus"
  ON product_skus FOR DELETE
  TO anon
  USING (true);
