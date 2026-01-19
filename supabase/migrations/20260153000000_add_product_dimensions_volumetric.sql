-- Add product dimensions for volumetric weight-based transfer cost allocation
-- Shipping costs are typically charged by dimensional/volumetric weight, not unit count

-- =============================================================================
-- 1. Add dimension columns to products table
-- =============================================================================

-- Dimensions in centimeters (standard for international shipping)
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm DECIMAL(10, 2);

-- Actual weight in kilograms
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10, 4);

-- Dimensional factor (5000 for cm/kg is standard, 139 for inches/lbs)
-- Can be overridden per product for specific carrier requirements
ALTER TABLE products ADD COLUMN IF NOT EXISTS dim_factor INT NOT NULL DEFAULT 5000;

-- Add comments for documentation
COMMENT ON COLUMN products.length_cm IS 'Product length in centimeters for volumetric weight calculation';
COMMENT ON COLUMN products.width_cm IS 'Product width in centimeters for volumetric weight calculation';
COMMENT ON COLUMN products.height_cm IS 'Product height in centimeters for volumetric weight calculation';
COMMENT ON COLUMN products.weight_kg IS 'Actual product weight in kilograms';
COMMENT ON COLUMN products.dim_factor IS 'Dimensional factor for volumetric weight (5000 for cm/kg standard, 139 for inches/lbs)';

-- =============================================================================
-- 2. Helper function to calculate billable weight
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_billable_weight(
  p_length_cm DECIMAL,
  p_width_cm DECIMAL,
  p_height_cm DECIMAL,
  p_weight_kg DECIMAL,
  p_dim_factor INT DEFAULT 5000
)
RETURNS DECIMAL AS $$
DECLARE
  v_volumetric_weight DECIMAL;
BEGIN
  -- If no dimensions, return NULL (caller will fall back to quantity-based)
  IF p_length_cm IS NULL OR p_width_cm IS NULL OR p_height_cm IS NULL THEN
    RETURN NULL;
  END IF;

  -- Volumetric weight = (L × W × H) / dimensional factor
  v_volumetric_weight := (p_length_cm * p_width_cm * p_height_cm) / COALESCE(p_dim_factor, 5000);

  -- Billable weight = MAX(actual weight, volumetric weight)
  -- If no actual weight, use volumetric weight
  RETURN GREATEST(COALESCE(p_weight_kg, 0), v_volumetric_weight);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- 3. Update batch_cogs view to use volumetric weight allocation
-- =============================================================================

DROP VIEW IF EXISTS batch_cogs CASCADE;

CREATE OR REPLACE VIEW batch_cogs AS
SELECT
  b.id AS batch_id,
  b.batch_number,
  b.sku,
  b.product_name,
  b.product_id,
  b.quantity AS original_quantity,
  b.unit_cost AS product_unit_cost,
  b.total_cost AS product_total_cost,
  b.ordered_date,
  b.stage,

  -- Transfer/shipping costs attributed to this batch
  -- Now prorated by volumetric weight when dimensions available, falls back to quantity
  COALESCE((
    SELECT SUM(
      CASE
        WHEN transfer_totals.total_weight > 0 THEN
          -- Volumetric weight-based allocation
          t.total_cost * (tli.quantity * COALESCE(
            calculate_billable_weight(p.length_cm, p.width_cm, p.height_cm, p.weight_kg, p.dim_factor),
            1  -- Fallback: treat as 1kg per unit if no dimensions
          ))::DECIMAL / transfer_totals.total_weight
        WHEN transfer_totals.total_qty > 0 THEN
          -- Fallback: quantity-based allocation if no product has dimensions
          t.total_cost * tli.quantity::DECIMAL / transfer_totals.total_qty
        ELSE 0
      END
    )
    FROM transfer_line_items tli
    JOIN transfers t ON t.id = tli.transfer_id
    LEFT JOIN products p ON p.id = b.product_id
    -- Subquery to get transfer totals (volumetric weight and quantity)
    LEFT JOIN LATERAL (
      SELECT
        SUM(tli2.quantity * COALESCE(
          calculate_billable_weight(p2.length_cm, p2.width_cm, p2.height_cm, p2.weight_kg, p2.dim_factor),
          1
        )) AS total_weight,
        SUM(tli2.quantity) AS total_qty
      FROM transfer_line_items tli2
      LEFT JOIN batches b2 ON b2.id = tli2.batch_id
      LEFT JOIN products p2 ON p2.id = b2.product_id
      WHERE tli2.transfer_id = t.id
    ) transfer_totals ON true
    WHERE tli.batch_id = b.id AND t.status = 'completed'
  ), 0) AS transfer_costs,

  -- Work order / assembly costs (if assembled)
  COALESCE((
    SELECT SUM(woc.amount)
    FROM work_order_costs woc
    JOIN work_orders wo ON wo.id = woc.work_order_id
    WHERE wo.output_batch_id = b.id
  ), 0) AS assembly_costs,

  -- Amazon fees directly attributed to batch
  COALESCE((
    SELECT SUM(amount)
    FROM amazon_fees af
    WHERE af.batch_id = b.id AND af.include_in_cogs = true
  ), 0) AS amazon_fees_direct,

  -- Amazon fees allocated to batch
  COALESCE((
    SELECT SUM(allocated_amount)
    FROM amazon_fee_allocations afa
    JOIN amazon_fees af ON af.id = afa.fee_id
    WHERE afa.batch_id = b.id AND af.include_in_cogs = true
  ), 0) AS amazon_fees_allocated,

  -- Inventory losses from this batch
  COALESCE((
    SELECT SUM(net_loss)
    FROM inventory_losses
    WHERE batch_id = b.id AND include_in_cogs = true
  ), 0) AS inventory_losses,

  -- Units sold from this batch
  COALESCE((
    SELECT SUM(quantity)
    FROM sales_batch_attributions
    WHERE batch_id = b.id
  ), 0) AS units_sold,

  -- Units lost from this batch
  COALESCE((
    SELECT SUM(quantity)
    FROM inventory_losses
    WHERE batch_id = b.id
  ), 0) AS units_lost,

  -- Remaining units
  b.quantity - COALESCE((
    SELECT SUM(quantity) FROM sales_batch_attributions WHERE batch_id = b.id
  ), 0) - COALESCE((
    SELECT SUM(quantity) FROM inventory_losses WHERE batch_id = b.id
  ), 0) AS units_remaining,

  -- Supplier info
  b.supplier_id,
  s.name AS supplier_name,
  b.po_id,
  b.created_at

FROM batches b
LEFT JOIN suppliers s ON s.id = b.supplier_id;

-- =============================================================================
-- 4. Update calculate_product_cogs function for volumetric weight
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_product_cogs(
  p_product_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_settings_name TEXT DEFAULT 'default'
)
RETURNS TABLE (
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  period_start DATE,
  period_end DATE,
  units_sold BIGINT,
  product_cost DECIMAL,
  transfer_cost DECIMAL,
  inbound_fees DECIMAL,
  fba_fees DECIMAL,
  storage_fees DECIMAL,
  awd_fees DECIMAL,
  inventory_losses DECIMAL,
  total_cogs DECIMAL,
  avg_cogs_per_unit DECIMAL
) AS $$
DECLARE
  v_settings cogs_settings;
BEGIN
  -- Get settings profile
  v_settings := get_cogs_settings(p_settings_name);

  RETURN QUERY
  WITH
  -- Calculate transfer cost per unit for each batch (using volumetric weight)
  batch_transfer_costs AS (
    SELECT
      tli.batch_id,
      SUM(
        CASE
          WHEN transfer_totals.total_weight > 0 THEN
            -- Volumetric weight-based allocation
            t.total_cost * (tli.quantity * COALESCE(
              calculate_billable_weight(p.length_cm, p.width_cm, p.height_cm, p.weight_kg, p.dim_factor),
              1
            ))::DECIMAL / transfer_totals.total_weight
          WHEN transfer_totals.total_qty > 0 THEN
            -- Fallback: quantity-based
            t.total_cost * tli.quantity::DECIMAL / transfer_totals.total_qty
          ELSE 0
        END
      ) AS total_transfer_cost
    FROM transfer_line_items tli
    JOIN transfers t ON t.id = tli.transfer_id
    LEFT JOIN batches b ON b.id = tli.batch_id
    LEFT JOIN products p ON p.id = b.product_id
    LEFT JOIN LATERAL (
      SELECT
        SUM(tli2.quantity * COALESCE(
          calculate_billable_weight(p2.length_cm, p2.width_cm, p2.height_cm, p2.weight_kg, p2.dim_factor),
          1
        )) AS total_weight,
        SUM(tli2.quantity) AS total_qty
      FROM transfer_line_items tli2
      LEFT JOIN batches b2 ON b2.id = tli2.batch_id
      LEFT JOIN products p2 ON p2.id = b2.product_id
      WHERE tli2.transfer_id = t.id
    ) transfer_totals ON true
    WHERE t.status = 'completed'
    GROUP BY tli.batch_id
  ),

  -- Get batch info with transfer cost per unit
  batch_info AS (
    SELECT
      b.id AS batch_id,
      b.product_id,
      b.quantity AS batch_quantity,
      COALESCE(btc.total_transfer_cost, 0) AS transfer_cost_total,
      CASE
        WHEN b.quantity > 0 THEN COALESCE(btc.total_transfer_cost, 0) / b.quantity
        ELSE 0
      END AS transfer_cost_per_unit
    FROM batches b
    LEFT JOIN batch_transfer_costs btc ON btc.batch_id = b.id
  ),

  -- Sales with FIFO attribution including transfer costs
  sales_data AS (
    SELECT
      aoi.internal_product_id,
      SUM(aoi.quantity_shipped) AS units,
      SUM(sba.total_cost) AS prod_cost,
      -- Transfer cost = sum of (attributed units * transfer cost per unit from that batch)
      SUM(sba.quantity * COALESCE(bi.transfer_cost_per_unit, 0)) AS transfer_cost
    FROM amazon_order_items aoi
    JOIN amazon_orders ao ON ao.id = aoi.order_id
    LEFT JOIN sales_batch_attributions sba ON sba.order_item_id = aoi.id
    LEFT JOIN batch_info bi ON bi.batch_id = sba.batch_id
    WHERE ao.ship_date >= p_start_date
      AND ao.ship_date <= p_end_date
      AND ao.status IN ('shipped', 'delivered')
      AND (p_product_id IS NULL OR aoi.internal_product_id = p_product_id)
    GROUP BY aoi.internal_product_id
  ),

  -- Fee data by product
  fee_data AS (
    SELECT
      afa.product_id,
      SUM(CASE WHEN af.fee_type IN ('inbound_placement', 'inbound_transportation')
          AND v_settings.include_inbound_placement THEN afa.allocated_amount ELSE 0 END) AS inbound_fees,
      SUM(CASE WHEN af.fee_type = 'fba_fulfillment'
          AND v_settings.include_fba_fulfillment THEN afa.allocated_amount ELSE 0 END) AS fba_fees,
      SUM(CASE WHEN af.fee_type IN ('fba_storage_monthly', 'fba_storage_long_term')
          AND v_settings.include_fba_storage THEN afa.allocated_amount ELSE 0 END) AS storage_fees,
      SUM(CASE WHEN af.fee_type IN ('awd_storage', 'awd_processing', 'awd_transportation')
          AND (v_settings.include_awd_storage OR v_settings.include_awd_processing OR v_settings.include_awd_transportation)
          THEN afa.allocated_amount ELSE 0 END) AS awd_fees
    FROM amazon_fee_allocations afa
    JOIN amazon_fees af ON af.id = afa.fee_id
    WHERE afa.allocation_month >= DATE_TRUNC('month', p_start_date)
      AND afa.allocation_month <= DATE_TRUNC('month', p_end_date)
      AND (p_product_id IS NULL OR afa.product_id = p_product_id)
    GROUP BY afa.product_id
  ),

  -- Loss data by product
  loss_data AS (
    SELECT
      il.product_id,
      SUM(CASE
        WHEN il.loss_type IN ('damaged_inbound', 'damaged_warehouse', 'lost_warehouse')
             AND v_settings.include_damaged_lost THEN il.net_loss
        WHEN il.loss_type IN ('disposed', 'expired')
             AND v_settings.include_disposed THEN il.net_loss
        ELSE 0
      END) AS total_loss
    FROM inventory_losses il
    WHERE il.loss_date >= p_start_date
      AND il.loss_date <= p_end_date
      AND (p_product_id IS NULL OR il.product_id = p_product_id)
    GROUP BY il.product_id
  )

  -- Combine all data
  SELECT
    p.id AS product_id,
    ps.sku AS sku,
    p.name AS product_name,
    p_start_date AS period_start,
    p_end_date AS period_end,
    COALESCE(sd.units, 0)::BIGINT AS units_sold,

    -- Product cost (from FIFO)
    CASE WHEN v_settings.include_product_cost
         THEN COALESCE(sd.prod_cost, 0) ELSE 0 END AS product_cost,

    -- Transfer cost (from FIFO batch attribution, now volumetric)
    CASE WHEN v_settings.include_shipping_to_amazon
         THEN COALESCE(sd.transfer_cost, 0) ELSE 0 END AS transfer_cost,

    -- Fees
    COALESCE(fd.inbound_fees, 0) AS inbound_fees,
    COALESCE(fd.fba_fees, 0) AS fba_fees,
    COALESCE(fd.storage_fees, 0) AS storage_fees,
    COALESCE(fd.awd_fees, 0) AS awd_fees,

    -- Losses
    COALESCE(ld.total_loss, 0) AS inventory_losses,

    -- Total COGS
    (CASE WHEN v_settings.include_product_cost THEN COALESCE(sd.prod_cost, 0) ELSE 0 END)
    + (CASE WHEN v_settings.include_shipping_to_amazon THEN COALESCE(sd.transfer_cost, 0) ELSE 0 END)
    + COALESCE(fd.inbound_fees, 0)
    + COALESCE(fd.fba_fees, 0)
    + COALESCE(fd.storage_fees, 0)
    + COALESCE(fd.awd_fees, 0)
    + COALESCE(ld.total_loss, 0) AS total_cogs,

    -- Avg per unit
    CASE WHEN COALESCE(sd.units, 0) > 0 THEN
      ((CASE WHEN v_settings.include_product_cost THEN COALESCE(sd.prod_cost, 0) ELSE 0 END)
       + (CASE WHEN v_settings.include_shipping_to_amazon THEN COALESCE(sd.transfer_cost, 0) ELSE 0 END)
       + COALESCE(fd.inbound_fees, 0)
       + COALESCE(fd.fba_fees, 0)
       + COALESCE(fd.storage_fees, 0)
       + COALESCE(fd.awd_fees, 0)
       + COALESCE(ld.total_loss, 0)) / sd.units
    ELSE 0 END AS avg_cogs_per_unit

  FROM products p
  LEFT JOIN product_skus ps ON ps.product_id = p.id AND ps.is_default = true
  LEFT JOIN sales_data sd ON sd.internal_product_id = p.id
  LEFT JOIN fee_data fd ON fd.product_id = p.id
  LEFT JOIN loss_data ld ON ld.product_id = p.id
  WHERE (p_product_id IS NULL OR p.id = p_product_id)
    AND (sd.units > 0 OR fd.inbound_fees > 0 OR fd.fba_fees > 0 OR ld.total_loss > 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. Create view for product dimensions summary
-- =============================================================================

CREATE OR REPLACE VIEW product_dimensions AS
SELECT
  p.id,
  p.sku,
  p.name,
  p.length_cm,
  p.width_cm,
  p.height_cm,
  p.weight_kg,
  p.dim_factor,
  calculate_billable_weight(p.length_cm, p.width_cm, p.height_cm, p.weight_kg, p.dim_factor) AS billable_weight_kg,
  CASE
    WHEN p.length_cm IS NOT NULL AND p.width_cm IS NOT NULL AND p.height_cm IS NOT NULL
    THEN true
    ELSE false
  END AS has_dimensions
FROM products p;

COMMENT ON VIEW product_dimensions IS 'Product dimensions and calculated billable weight for transfer cost allocation';
