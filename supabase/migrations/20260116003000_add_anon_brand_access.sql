-- Allow anonymous users to view brands
-- Brands are not sensitive and should be viewable without authentication

CREATE POLICY "Anyone can view brands"
  ON brands FOR SELECT
  TO anon
  USING (true);
