-- Fix COGS: Add missing function, fix month format, add default settings

-- =============================================================================
-- 1. Drop and recreate get_cogs_settings function with correct signature
-- =============================================================================
DROP FUNCTION IF EXISTS get_cogs_settings(TEXT);

CREATE OR REPLACE FUNCTION get_cogs_settings(p_name TEXT DEFAULT 'default')
RETURNS cogs_settings AS $$
DECLARE
  v_settings cogs_settings;
BEGIN
  SELECT * INTO v_settings FROM cogs_settings WHERE name = p_name;
  IF NOT FOUND THEN
    SELECT * INTO v_settings FROM cogs_settings WHERE is_default = true LIMIT 1;
  END IF;
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. Insert default settings if not exists
-- =============================================================================
INSERT INTO cogs_settings (
  name,
  description,
  is_default,
  include_product_cost,
  include_shipping_to_amazon,
  include_duties_taxes,
  include_fba_fulfillment,
  include_fba_storage,
  include_fba_prep,
  include_fba_labeling,
  include_inbound_placement,
  include_inbound_transportation,
  include_awd_storage,
  include_awd_processing,
  include_awd_transportation,
  include_referral_fees,
  include_advertising,
  include_damaged_lost,
  include_disposed,
  include_assembly_costs
)
SELECT
  'default',
  'Default COGS calculation profile',
  true,
  true,   -- include_product_cost
  true,   -- include_shipping_to_amazon
  true,   -- include_duties_taxes
  false,  -- include_fba_fulfillment
  false,  -- include_fba_storage
  false,  -- include_fba_prep
  false,  -- include_fba_labeling
  true,   -- include_inbound_placement
  true,   -- include_inbound_transportation
  false,  -- include_awd_storage
  false,  -- include_awd_processing
  false,  -- include_awd_transportation
  false,  -- include_referral_fees
  false,  -- include_advertising
  true,   -- include_damaged_lost
  true,   -- include_disposed
  true    -- include_assembly_costs
WHERE NOT EXISTS (SELECT 1 FROM cogs_settings WHERE name = 'default');

-- Insert SellerBoard profile if not exists
INSERT INTO cogs_settings (
  name,
  description,
  is_default,
  include_product_cost,
  include_shipping_to_amazon,
  include_duties_taxes,
  include_fba_fulfillment,
  include_fba_storage,
  include_inbound_placement,
  include_inbound_transportation,
  include_damaged_lost,
  include_disposed,
  include_assembly_costs
)
SELECT
  'sellerboard',
  'SellerBoard-compatible COGS (product cost only)',
  false,
  true,   -- include_product_cost
  true,   -- include_shipping_to_amazon
  true,   -- include_duties_taxes
  false,  -- include_fba_fulfillment (tracked separately in SB)
  false,  -- include_fba_storage (tracked separately in SB)
  false,  -- include_inbound_placement (tracked separately in SB)
  false,  -- include_inbound_transportation
  false,  -- include_damaged_lost
  false,  -- include_disposed
  false   -- include_assembly_costs
WHERE NOT EXISTS (SELECT 1 FROM cogs_settings WHERE name = 'sellerboard');

-- =============================================================================
-- 3. Fix monthly_product_cogs view - use TEXT format for month
-- =============================================================================
DROP VIEW IF EXISTS monthly_product_cogs CASCADE;
CREATE VIEW monthly_product_cogs AS
SELECT
  TO_CHAR(DATE_TRUNC('month', ao.ship_date), 'YYYY-MM') AS month,
  aoi.seller_sku AS sku,
  aoi.internal_product_id AS product_id,
  p.name AS product_name,
  ao.marketplace,

  -- Sales metrics
  SUM(aoi.quantity_shipped) AS units_sold,
  SUM(aoi.total_revenue_usd) AS revenue_usd,

  -- Product cost (from FIFO batch attributions)
  COALESCE(SUM(sba.total_cost), 0) AS product_cost,

  -- Weighted average unit cost
  CASE
    WHEN SUM(aoi.quantity_shipped) > 0 THEN
      COALESCE(SUM(sba.total_cost), 0) / SUM(aoi.quantity_shipped)
    ELSE 0
  END AS avg_unit_cost

FROM amazon_orders ao
JOIN amazon_order_items aoi ON aoi.order_id = ao.id
LEFT JOIN products p ON p.id = aoi.internal_product_id
LEFT JOIN sales_batch_attributions sba ON sba.order_item_id = aoi.id
WHERE ao.ship_date IS NOT NULL
  AND ao.status IN ('shipped', 'delivered')
GROUP BY
  TO_CHAR(DATE_TRUNC('month', ao.ship_date), 'YYYY-MM'),
  aoi.seller_sku,
  aoi.internal_product_id,
  p.name,
  ao.marketplace;

-- =============================================================================
-- 4. Fix cogs_monthly_summary view - use TEXT format for month
-- =============================================================================
DROP VIEW IF EXISTS cogs_monthly_summary CASCADE;
CREATE VIEW cogs_monthly_summary AS
SELECT
  TO_CHAR(DATE_TRUNC('month', ao.ship_date), 'YYYY-MM') AS month,
  ao.marketplace,

  -- Volume
  COUNT(DISTINCT ao.id) AS order_count,
  SUM(aoi.quantity_shipped) AS units_sold,
  SUM(aoi.total_revenue_usd) AS total_revenue,

  -- Product cost
  COALESCE(SUM(sba.total_cost), 0) AS product_cost,

  -- Calculate gross margin
  SUM(aoi.total_revenue_usd) - COALESCE(SUM(sba.total_cost), 0) AS gross_profit,
  CASE
    WHEN SUM(aoi.total_revenue_usd) > 0 THEN
      ((SUM(aoi.total_revenue_usd) - COALESCE(SUM(sba.total_cost), 0)) / SUM(aoi.total_revenue_usd)) * 100
    ELSE 0
  END AS gross_margin_pct,

  -- Average unit cost
  CASE
    WHEN SUM(aoi.quantity_shipped) > 0 THEN
      COALESCE(SUM(sba.total_cost), 0) / SUM(aoi.quantity_shipped)
    ELSE 0
  END AS avg_unit_cost

FROM amazon_orders ao
JOIN amazon_order_items aoi ON aoi.order_id = ao.id
LEFT JOIN sales_batch_attributions sba ON sba.order_item_id = aoi.id
WHERE ao.ship_date IS NOT NULL
  AND ao.status IN ('shipped', 'delivered')
GROUP BY
  TO_CHAR(DATE_TRUNC('month', ao.ship_date), 'YYYY-MM'),
  ao.marketplace
ORDER BY month DESC, marketplace;

-- =============================================================================
-- 5. Fix monthly_product_fees view - use TEXT format for month
-- =============================================================================
DROP VIEW IF EXISTS monthly_product_fees CASCADE;
CREATE VIEW monthly_product_fees AS
SELECT
  TO_CHAR(afa.allocation_month, 'YYYY-MM') AS month,
  afa.product_id,
  p.name AS product_name,
  SUM(CASE WHEN af.fee_type IN ('inbound_transportation') THEN afa.allocated_amount ELSE 0 END) AS inbound_transportation_fees,
  SUM(CASE WHEN af.fee_type = 'inbound_placement' THEN afa.allocated_amount ELSE 0 END) AS inbound_placement_fees,
  SUM(CASE WHEN af.fee_type = 'fba_fulfillment' THEN afa.allocated_amount ELSE 0 END) AS fba_fulfillment_fees,
  SUM(CASE WHEN af.fee_type IN ('fba_storage_monthly', 'fba_storage_long_term') THEN afa.allocated_amount ELSE 0 END) AS storage_fees,
  SUM(CASE WHEN af.fee_type IN ('awd_storage', 'awd_processing', 'awd_transportation') THEN afa.allocated_amount ELSE 0 END) AS awd_fees,
  SUM(afa.allocated_amount) AS total_fees
FROM amazon_fee_allocations afa
JOIN amazon_fees af ON af.id = afa.fee_id
LEFT JOIN products p ON p.id = afa.product_id
WHERE af.include_in_cogs = true
GROUP BY
  TO_CHAR(afa.allocation_month, 'YYYY-MM'),
  afa.product_id,
  p.name;

-- =============================================================================
-- 6. Fix monthly_product_losses view - use TEXT format for month
-- =============================================================================
DROP VIEW IF EXISTS monthly_product_losses CASCADE;
CREATE VIEW monthly_product_losses AS
SELECT
  TO_CHAR(DATE_TRUNC('month', il.loss_date), 'YYYY-MM') AS month,
  il.product_id,
  p.name AS product_name,
  SUM(il.quantity) AS units_lost,
  SUM(il.net_loss) AS total_loss
FROM inventory_losses il
LEFT JOIN products p ON p.id = il.product_id
WHERE il.include_in_cogs = true
GROUP BY
  TO_CHAR(DATE_TRUNC('month', il.loss_date), 'YYYY-MM'),
  il.product_id,
  p.name;
