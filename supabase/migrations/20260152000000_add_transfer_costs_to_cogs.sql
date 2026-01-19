-- Add transfer costs to COGS calculation
-- Transfer costs are prorated by quantity across batches in each transfer

-- =============================================================================
-- Update calculate_product_cogs to include transfer costs
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
  -- Get settings
  SELECT * INTO v_settings FROM get_cogs_settings(p_settings_name);

  RETURN QUERY
  WITH
  -- Calculate transfer cost per unit for each batch
  batch_transfer_costs AS (
    SELECT
      tli.batch_id,
      SUM(
        CASE
          WHEN (SELECT SUM(tli2.quantity) FROM transfer_line_items tli2 WHERE tli2.transfer_id = t.id) > 0
          THEN t.total_cost * tli.quantity::DECIMAL / (
            SELECT SUM(tli2.quantity) FROM transfer_line_items tli2 WHERE tli2.transfer_id = t.id
          )
          ELSE 0
        END
      ) AS total_transfer_cost
    FROM transfer_line_items tli
    JOIN transfers t ON t.id = tli.transfer_id
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

  -- Fee allocations by product
  fee_data AS (
    SELECT
      afa.product_id,
      SUM(CASE WHEN af.fee_type IN ('inbound_placement', 'inbound_transportation')
               AND v_settings.include_inbound_placement THEN afa.allocated_amount ELSE 0 END) AS inbound,
      SUM(CASE WHEN af.fee_type = 'fba_fulfillment'
               AND v_settings.include_fba_fulfillment THEN afa.allocated_amount ELSE 0 END) AS fba,
      SUM(CASE WHEN af.fee_type IN ('fba_storage_monthly', 'fba_storage_long_term')
               AND v_settings.include_fba_storage THEN afa.allocated_amount ELSE 0 END) AS storage,
      SUM(CASE WHEN af.fee_type IN ('awd_storage', 'awd_processing', 'awd_transportation')
               AND v_settings.include_awd_storage THEN afa.allocated_amount ELSE 0 END) AS awd
    FROM amazon_fee_allocations afa
    JOIN amazon_fees af ON af.id = afa.fee_id
    WHERE afa.allocation_month >= DATE_TRUNC('month', p_start_date)
      AND afa.allocation_month <= DATE_TRUNC('month', p_end_date)
      AND af.include_in_cogs = true
      AND (p_product_id IS NULL OR afa.product_id = p_product_id)
    GROUP BY afa.product_id
  ),

  -- Inventory losses by product
  loss_data AS (
    SELECT
      il.product_id,
      SUM(il.net_loss) AS losses
    FROM inventory_losses il
    WHERE il.loss_date >= p_start_date
      AND il.loss_date <= p_end_date
      AND il.include_in_cogs = true
      AND v_settings.include_damaged_lost = true
      AND (p_product_id IS NULL OR il.product_id = p_product_id)
    GROUP BY il.product_id
  )

  SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p_start_date AS period_start,
    p_end_date AS period_end,
    COALESCE(sd.units, 0)::BIGINT AS units_sold,
    COALESCE(sd.prod_cost, 0) AS product_cost,
    -- Only include transfer cost if shipping_to_amazon setting is enabled
    CASE WHEN v_settings.include_shipping_to_amazon
         THEN COALESCE(sd.transfer_cost, 0)
         ELSE 0
    END AS transfer_cost,
    COALESCE(fd.inbound, 0) AS inbound_fees,
    COALESCE(fd.fba, 0) AS fba_fees,
    COALESCE(fd.storage, 0) AS storage_fees,
    COALESCE(fd.awd, 0) AS awd_fees,
    COALESCE(ld.losses, 0) AS inventory_losses,
    -- Total COGS including transfer costs
    (COALESCE(sd.prod_cost, 0) +
     CASE WHEN v_settings.include_shipping_to_amazon THEN COALESCE(sd.transfer_cost, 0) ELSE 0 END +
     COALESCE(fd.inbound, 0) + COALESCE(fd.fba, 0) +
     COALESCE(fd.storage, 0) + COALESCE(fd.awd, 0) + COALESCE(ld.losses, 0)) AS total_cogs,
    CASE
      WHEN COALESCE(sd.units, 0) > 0 THEN
        (COALESCE(sd.prod_cost, 0) +
         CASE WHEN v_settings.include_shipping_to_amazon THEN COALESCE(sd.transfer_cost, 0) ELSE 0 END +
         COALESCE(fd.inbound, 0) + COALESCE(fd.fba, 0) +
         COALESCE(fd.storage, 0) + COALESCE(fd.awd, 0) + COALESCE(ld.losses, 0)) / sd.units
      ELSE 0
    END AS avg_cogs_per_unit
  FROM products p
  LEFT JOIN sales_data sd ON sd.internal_product_id = p.id
  LEFT JOIN fee_data fd ON fd.product_id = p.id
  LEFT JOIN loss_data ld ON ld.product_id = p.id
  WHERE p_product_id IS NULL OR p.id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Add comment explaining the transfer cost calculation
-- =============================================================================
COMMENT ON FUNCTION calculate_product_cogs IS
'Calculates COGS for products in a date range with configurable cost components.

Transfer costs are prorated:
1. Each transfer has a total_cost (shipping, duties, etc.)
2. Cost is split across line items by quantity ratio
3. Each batch accumulates its share of transfer costs
4. Transfer cost per unit = total transfer cost / batch quantity
5. When batch is depleted via FIFO, transfer cost follows the units sold

Example:
  Transfer T-001: $800 total, 350 units (200 Widget A + 150 Widget B)
  Widget A batch gets: $800 × 200/350 = $457.14
  If batch had 500 units, transfer cost per unit = $457.14 / 500 = $0.91
  Sell 100 units → $91.43 transfer cost attributed to that sale
';
