-- COGS Module: Amazon Sales Tracking
-- Tables for tracking Amazon orders and order items from SP-API

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

CREATE TYPE amazon_sales_channel AS ENUM (
  'FBA',           -- Fulfilled by Amazon
  'FBM',           -- Fulfilled by Merchant
  'AWD_TRANSFER'   -- AWD to FBA transfer
);

CREATE TYPE amazon_order_status AS ENUM (
  'pending',
  'unshipped',
  'partially_shipped',
  'shipped',
  'delivered',
  'cancelled',
  'unfulfillable'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Amazon Orders: Sales orders synced from SP-API
CREATE TABLE amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Amazon identifiers
  amazon_order_id TEXT NOT NULL UNIQUE,
  marketplace amazon_marketplace NOT NULL,
  sales_channel amazon_sales_channel NOT NULL DEFAULT 'FBA',

  -- Dates
  purchase_date TIMESTAMPTZ NOT NULL,
  ship_date TIMESTAMPTZ,             -- KEY: Used for COGS month attribution
  delivery_date TIMESTAMPTZ,

  -- Status
  status amazon_order_status NOT NULL DEFAULT 'pending',

  -- Currency (for multi-marketplace support)
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate_to_usd DECIMAL(10, 6) NOT NULL DEFAULT 1.0,

  -- Order totals (original currency)
  order_total DECIMAL(12, 2) DEFAULT 0,
  order_total_usd DECIMAL(12, 2) GENERATED ALWAYS AS (order_total * exchange_rate_to_usd) STORED,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'sp-api', 'import'

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Amazon Order Items: Line items within each order
CREATE TABLE amazon_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES amazon_orders(id) ON DELETE CASCADE,

  -- Amazon identifiers
  order_item_id TEXT NOT NULL,
  seller_sku TEXT NOT NULL,
  asin TEXT NOT NULL,

  -- Quantities
  quantity_ordered INT NOT NULL,
  quantity_shipped INT NOT NULL DEFAULT 0,

  -- Revenue (original currency from order)
  item_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  item_tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_tax DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Calculated USD values (via trigger since we need order's exchange rate)
  item_price_usd DECIMAL(12, 2),
  total_revenue_usd DECIMAL(12, 2),

  -- Internal product link
  internal_sku_id UUID REFERENCES product_skus(id) ON DELETE SET NULL,
  internal_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- COGS calculation status
  cogs_calculated BOOLEAN NOT NULL DEFAULT false,
  cogs_attributed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(order_id, order_item_id)
);

-- Sales-to-Batch Attribution: FIFO depletion ledger
-- Links each sale to the batch(es) that fulfilled it
CREATE TABLE sales_batch_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sale reference
  order_item_id UUID NOT NULL REFERENCES amazon_order_items(id) ON DELETE CASCADE,

  -- Batch depleted (FIFO)
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,

  -- Quantity from this batch
  quantity INT NOT NULL CHECK (quantity > 0),

  -- Cost at time of attribution (frozen from batch)
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Date of attribution (= ship_date from order)
  attributed_date DATE NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_amazon_orders_marketplace ON amazon_orders(marketplace);
CREATE INDEX idx_amazon_orders_ship_date ON amazon_orders(ship_date);
CREATE INDEX idx_amazon_orders_status ON amazon_orders(status);
CREATE INDEX idx_amazon_orders_purchase_date ON amazon_orders(purchase_date);
-- Note: DATE_TRUNC indexes removed due to IMMUTABLE requirement
-- Use partial indexes or query optimization instead

CREATE INDEX idx_amazon_order_items_order ON amazon_order_items(order_id);
CREATE INDEX idx_amazon_order_items_seller_sku ON amazon_order_items(seller_sku);
CREATE INDEX idx_amazon_order_items_asin ON amazon_order_items(asin);
CREATE INDEX idx_amazon_order_items_internal_product ON amazon_order_items(internal_product_id);
CREATE INDEX idx_amazon_order_items_cogs_pending ON amazon_order_items(cogs_calculated) WHERE cogs_calculated = false;

CREATE INDEX idx_sales_batch_attr_order_item ON sales_batch_attributions(order_item_id);
CREATE INDEX idx_sales_batch_attr_batch ON sales_batch_attributions(batch_id);
CREATE INDEX idx_sales_batch_attr_date ON sales_batch_attributions(attributed_date);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at for amazon_orders
CREATE TRIGGER amazon_orders_updated_at
  BEFORE UPDATE ON amazon_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Calculate USD values for order items when inserted/updated
CREATE OR REPLACE FUNCTION calculate_order_item_usd_values()
RETURNS TRIGGER AS $$
DECLARE
  v_exchange_rate DECIMAL(10, 6);
BEGIN
  -- Get exchange rate from parent order
  SELECT exchange_rate_to_usd INTO v_exchange_rate
  FROM amazon_orders
  WHERE id = NEW.order_id;

  -- Calculate USD values
  NEW.item_price_usd := NEW.item_price * COALESCE(v_exchange_rate, 1.0);
  NEW.total_revenue_usd := (NEW.item_price + NEW.item_tax + NEW.shipping_price + NEW.shipping_tax) * COALESCE(v_exchange_rate, 1.0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_calc_usd
  BEFORE INSERT OR UPDATE OF item_price, item_tax, shipping_price, shipping_tax ON amazon_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_item_usd_values();

-- Auto-link order items to internal products via SKU mapping
CREATE OR REPLACE FUNCTION auto_link_order_item_to_product()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-link if not already linked
  IF NEW.internal_product_id IS NULL THEN
    SELECT internal_product_id, internal_sku_id
    INTO NEW.internal_product_id, NEW.internal_sku_id
    FROM amazon_sku_mappings
    WHERE amazon_seller_sku = NEW.seller_sku
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_auto_link
  BEFORE INSERT ON amazon_order_items
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_order_item_to_product();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Sales summary by month and product
CREATE VIEW monthly_sales_summary AS
SELECT
  DATE_TRUNC('month', ao.ship_date) AS month,
  aoi.seller_sku,
  aoi.internal_product_id,
  p.name AS product_name,
  ao.marketplace,
  COUNT(DISTINCT ao.id) AS order_count,
  SUM(aoi.quantity_shipped) AS units_sold,
  SUM(aoi.total_revenue_usd) AS revenue_usd,
  COUNT(*) FILTER (WHERE aoi.cogs_calculated = false) AS pending_cogs_count
FROM amazon_orders ao
JOIN amazon_order_items aoi ON aoi.order_id = ao.id
LEFT JOIN products p ON p.id = aoi.internal_product_id
WHERE ao.ship_date IS NOT NULL
  AND ao.status IN ('shipped', 'delivered')
GROUP BY
  DATE_TRUNC('month', ao.ship_date),
  aoi.seller_sku,
  aoi.internal_product_id,
  p.name,
  ao.marketplace;

-- Pending COGS attribution view
CREATE VIEW pending_cogs_attribution AS
SELECT
  aoi.id AS order_item_id,
  aoi.seller_sku,
  aoi.quantity_shipped,
  ao.ship_date,
  aoi.internal_product_id,
  p.name AS product_name
FROM amazon_order_items aoi
JOIN amazon_orders ao ON ao.id = aoi.order_id
LEFT JOIN products p ON p.id = aoi.internal_product_id
WHERE aoi.cogs_calculated = false
  AND ao.ship_date IS NOT NULL
  AND aoi.quantity_shipped > 0
ORDER BY ao.ship_date ASC;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_batch_attributions ENABLE ROW LEVEL SECURITY;

-- Amazon orders policies
CREATE POLICY "Authenticated users can view amazon_orders"
  ON amazon_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert amazon_orders"
  ON amazon_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_orders"
  ON amazon_orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete amazon_orders"
  ON amazon_orders FOR DELETE TO authenticated USING (true);

-- Amazon order items policies
CREATE POLICY "Authenticated users can view amazon_order_items"
  ON amazon_order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert amazon_order_items"
  ON amazon_order_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update amazon_order_items"
  ON amazon_order_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete amazon_order_items"
  ON amazon_order_items FOR DELETE TO authenticated USING (true);

-- Sales batch attributions policies
CREATE POLICY "Authenticated users can view sales_batch_attributions"
  ON sales_batch_attributions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales_batch_attributions"
  ON sales_batch_attributions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sales_batch_attributions"
  ON sales_batch_attributions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete sales_batch_attributions"
  ON sales_batch_attributions FOR DELETE TO authenticated USING (true);
