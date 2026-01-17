-- ============================================================
-- CATALOG TABLES MIGRATION
-- Products, Product SKUs, Brands, and Spec Sheets
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

-- Product status enum
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');

-- SKU condition enum (for Amazon condition variations)
CREATE TYPE sku_condition AS ENUM (
  'new',
  'refurbished',
  'used-like-new',
  'used-very-good',
  'used-good',
  'used-acceptable'
);

-- Stock location type enum
CREATE TYPE stock_location_type AS ENUM (
  'factory',
  'warehouse',
  '3pl',
  'amazon-fba',
  'amazon-awd'
);

-- Brand status enum
CREATE TYPE brand_status AS ENUM ('active', 'inactive');

-- ============================================================
-- BRANDS TABLE
-- ============================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  status brand_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure brand names are unique
  CONSTRAINT brands_name_unique UNIQUE (name)
);

-- Index for status filtering
CREATE INDEX idx_brands_status ON brands(status);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  unit_cost DECIMAL(12, 4) NOT NULL DEFAULT 0,
  supplier_id UUID, -- Will be FK when suppliers table is created
  status product_status NOT NULL DEFAULT 'active',

  -- Primary/default identifiers (legacy/computed for backward compatibility)
  sku VARCHAR(100) NOT NULL,
  asin VARCHAR(20),
  fnsku VARCHAR(20),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- SKU must be unique across all products
  CONSTRAINT products_sku_unique UNIQUE (sku)
);

-- Indexes for common queries
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_name ON products(name);

-- Full-text search index for product search
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(asin, ''))
);

-- ============================================================
-- PRODUCT SPEC SHEETS TABLE
-- ============================================================

CREATE TABLE product_spec_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
  notes TEXT,
  uploaded_by_id UUID, -- Will be FK when auth.users is set up
  uploaded_by_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one spec sheet per product (latest version)
  CONSTRAINT product_spec_sheets_product_unique UNIQUE (product_id)
);

-- Index for looking up by product
CREATE INDEX idx_product_spec_sheets_product_id ON product_spec_sheets(product_id);

-- ============================================================
-- PRODUCT SKUS TABLE (SKU Variants)
-- ============================================================

CREATE TABLE product_skus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  condition sku_condition NOT NULL DEFAULT 'new',
  asin VARCHAR(20),
  fnsku VARCHAR(20),
  upc VARCHAR(20),
  ean VARCHAR(20),
  is_default BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- SKU must be unique across all SKU variants
  CONSTRAINT product_skus_sku_unique UNIQUE (sku)
);

-- Indexes
CREATE INDEX idx_product_skus_product_id ON product_skus(product_id);
CREATE INDEX idx_product_skus_sku ON product_skus(sku);
CREATE INDEX idx_product_skus_asin ON product_skus(asin);
CREATE INDEX idx_product_skus_condition ON product_skus(condition);
CREATE INDEX idx_product_skus_is_default ON product_skus(is_default) WHERE is_default = true;

-- ============================================================
-- MARKETPLACE LISTINGS TABLE (Per-marketplace ASIN/FNSKU)
-- ============================================================

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_sku_id UUID NOT NULL REFERENCES product_skus(id) ON DELETE CASCADE,
  marketplace VARCHAR(10) NOT NULL, -- US, UK, DE, etc.
  asin VARCHAR(20) NOT NULL,
  fnsku VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One listing per marketplace per SKU
  CONSTRAINT marketplace_listings_unique UNIQUE (product_sku_id, marketplace)
);

-- Index for marketplace queries
CREATE INDEX idx_marketplace_listings_sku_id ON marketplace_listings(product_sku_id);
CREATE INDEX idx_marketplace_listings_marketplace ON marketplace_listings(marketplace);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_skus_updated_at
  BEFORE UPDATE ON product_skus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENSURE ONLY ONE DEFAULT SKU PER PRODUCT
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_single_default_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this SKU as default, unset any existing default for this product
  IF NEW.is_default = true THEN
    UPDATE product_skus
    SET is_default = false
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_sku_trigger
  BEFORE INSERT OR UPDATE ON product_skus
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_sku();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_spec_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- For now, allow authenticated users full access
-- This will be refined when we add organization/team support

CREATE POLICY "Authenticated users can view brands"
  ON brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage brands"
  ON brands FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view spec sheets"
  ON product_spec_sheets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage spec sheets"
  ON product_spec_sheets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view product SKUs"
  ON product_skus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage product SKUs"
  ON product_skus FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view marketplace listings"
  ON marketplace_listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage marketplace listings"
  ON marketplace_listings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKET FOR SPEC SHEETS
-- ============================================================

-- Note: Storage bucket needs to be created via Supabase dashboard or API
-- This is a placeholder comment. Run this in SQL Editor or use supabase CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('spec-sheets', 'spec-sheets', false);
