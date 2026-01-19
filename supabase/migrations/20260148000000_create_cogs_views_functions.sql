-- COGS Module: Views and Functions
-- Core COGS calculation logic, FIFO attribution, and reporting views

-- =============================================================================
-- FIFO ATTRIBUTION FUNCTIONS
-- =============================================================================

-- Deplete batch stock FIFO for a single sale
CREATE OR REPLACE FUNCTION attribute_sale_to_batches(
  p_order_item_id UUID,
  p_seller_sku TEXT,
  p_quantity INT,
  p_ship_date DATE
)
RETURNS INT AS $$
DECLARE
  v_remaining INT := p_quantity;
  v_batch RECORD;
  v_available INT;
  v_to_attribute INT;
BEGIN
  -- Find batches with available stock at Amazon, ordered by FIFO (oldest first)
  FOR v_batch IN
    SELECT
      b.id,
      b.unit_cost,
      b.quantity - COALESCE((
        SELECT SUM(sba.quantity)
        FROM sales_batch_attributions sba
        WHERE sba.batch_id = b.id
      ), 0) - COALESCE((
        SELECT SUM(il.quantity)
        FROM inventory_losses il
        WHERE il.batch_id = b.id
      ), 0) AS available
    FROM batches b
    WHERE b.sku = p_seller_sku
      AND b.stage = 'amazon'
    ORDER BY b.ordered_date ASC, b.created_at ASC  -- FIFO
  LOOP
    v_available := GREATEST(v_batch.available, 0);

    IF v_available > 0 AND v_remaining > 0 THEN
      v_to_attribute := LEAST(v_available, v_remaining);

      -- Create attribution record
      INSERT INTO sales_batch_attributions (
        order_item_id,
        batch_id,
        quantity,
        unit_cost,
        attributed_date
      ) VALUES (
        p_order_item_id,
        v_batch.id,
        v_to_attribute,
        v_batch.unit_cost,
        p_ship_date
      );

      v_remaining := v_remaining - v_to_attribute;
    END IF;

    EXIT WHEN v_remaining <= 0;
  END LOOP;

  -- Return quantity that couldn't be attributed (insufficient stock)
  RETURN v_remaining;
END;
$$ LANGUAGE plpgsql;

-- Process all pending sales for COGS attribution
CREATE OR REPLACE FUNCTION process_pending_sales_attribution()
RETURNS TABLE (
  order_item_id UUID,
  seller_sku TEXT,
  requested_quantity INT,
  attributed_quantity INT,
  unattributed_quantity INT
) AS $$
DECLARE
  v_item RECORD;
  v_unattributed INT;
BEGIN
  FOR v_item IN
    SELECT
      aoi.id,
      aoi.seller_sku,
      aoi.quantity_shipped,
      ao.ship_date
    FROM amazon_order_items aoi
    JOIN amazon_orders ao ON ao.id = aoi.order_id
    WHERE aoi.cogs_calculated = false
      AND ao.ship_date IS NOT NULL
      AND aoi.quantity_shipped > 0
    ORDER BY ao.ship_date ASC
  LOOP
    v_unattributed := attribute_sale_to_batches(
      v_item.id,
      v_item.seller_sku,
      v_item.quantity_shipped,
      v_item.ship_date::DATE
    );

    -- Mark as processed
    UPDATE amazon_order_items
    SET
      cogs_calculated = true,
      cogs_attributed_at = NOW()
    WHERE id = v_item.id;

    order_item_id := v_item.id;
    seller_sku := v_item.seller_sku;
    requested_quantity := v_item.quantity_shipped;
    attributed_quantity := v_item.quantity_shipped - v_unattributed;
    unattributed_quantity := v_unattributed;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- BATCH COGS VIEW
-- =============================================================================

-- Per-batch COGS breakdown
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

  -- Transfer/shipping costs attributed to this batch (prorated)
  COALESCE((
    SELECT SUM(
      CASE
        WHEN (SELECT SUM(tli2.quantity) FROM transfer_line_items tli2 WHERE tli2.transfer_id = t.id) > 0
        THEN t.total_cost * tli.quantity::DECIMAL / (
          SELECT SUM(tli2.quantity) FROM transfer_line_items tli2 WHERE tli2.transfer_id = t.id
        )
        ELSE 0
      END
    )
    FROM transfer_line_items tli
    JOIN transfers t ON t.id = tli.transfer_id
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
-- MONTHLY COGS REPORT VIEW
-- =============================================================================

-- Monthly COGS by product with weighted average (simplified - fees joined separately)
CREATE OR REPLACE VIEW monthly_product_cogs AS
SELECT
  DATE_TRUNC('month', ao.ship_date) AS month,
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
  DATE_TRUNC('month', ao.ship_date),
  aoi.seller_sku,
  aoi.internal_product_id,
  p.name,
  ao.marketplace;

-- Separate view for fee allocations by product and month
CREATE OR REPLACE VIEW monthly_product_fees AS
SELECT
  afa.allocation_month AS month,
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
  afa.allocation_month,
  afa.product_id,
  p.name;

-- Separate view for inventory losses by product and month
CREATE OR REPLACE VIEW monthly_product_losses AS
SELECT
  DATE_TRUNC('month', il.loss_date) AS month,
  il.product_id,
  p.name AS product_name,
  SUM(il.quantity) AS units_lost,
  SUM(il.net_loss) AS total_loss
FROM inventory_losses il
LEFT JOIN products p ON p.id = il.product_id
WHERE il.include_in_cogs = true
GROUP BY
  DATE_TRUNC('month', il.loss_date),
  il.product_id,
  p.name;

-- =============================================================================
-- BATCH FIFO DEPLETION VIEW
-- =============================================================================

-- Shows how each batch has been depleted over time
CREATE OR REPLACE VIEW batch_fifo_report AS
SELECT
  b.id AS batch_id,
  b.batch_number,
  b.sku,
  b.product_name,
  b.product_id,
  b.quantity AS original_quantity,
  b.unit_cost,
  b.ordered_date,
  b.actual_arrival AS received_date,
  b.stage,

  -- Sold from this batch
  COALESCE((
    SELECT SUM(sba.quantity)
    FROM sales_batch_attributions sba
    WHERE sba.batch_id = b.id
  ), 0) AS quantity_sold,

  -- Lost from this batch
  COALESCE((
    SELECT SUM(il.quantity)
    FROM inventory_losses il
    WHERE il.batch_id = b.id
  ), 0) AS quantity_lost,

  -- Remaining in batch
  b.quantity - COALESCE((
    SELECT SUM(sba.quantity)
    FROM sales_batch_attributions sba
    WHERE sba.batch_id = b.id
  ), 0) - COALESCE((
    SELECT SUM(il.quantity)
    FROM inventory_losses il
    WHERE il.batch_id = b.id
  ), 0) AS quantity_remaining,

  -- COGS recognized from this batch
  COALESCE((
    SELECT SUM(sba.total_cost)
    FROM sales_batch_attributions sba
    WHERE sba.batch_id = b.id
  ), 0) AS cogs_recognized,

  -- First sale date
  (SELECT MIN(ao.ship_date)
   FROM sales_batch_attributions sba
   JOIN amazon_order_items aoi ON aoi.id = sba.order_item_id
   JOIN amazon_orders ao ON ao.id = aoi.order_id
   WHERE sba.batch_id = b.id) AS first_sale_date,

  -- Last sale date
  (SELECT MAX(ao.ship_date)
   FROM sales_batch_attributions sba
   JOIN amazon_order_items aoi ON aoi.id = sba.order_item_id
   JOIN amazon_orders ao ON ao.id = aoi.order_id
   WHERE sba.batch_id = b.id) AS last_sale_date,

  -- Days to sell out (if fully depleted)
  CASE
    WHEN b.quantity - COALESCE((
      SELECT SUM(sba.quantity) FROM sales_batch_attributions sba WHERE sba.batch_id = b.id
    ), 0) - COALESCE((
      SELECT SUM(il.quantity) FROM inventory_losses il WHERE il.batch_id = b.id
    ), 0) <= 0
    THEN EXTRACT(DAY FROM (
      (SELECT MAX(ao.ship_date)
       FROM sales_batch_attributions sba
       JOIN amazon_order_items aoi ON aoi.id = sba.order_item_id
       JOIN amazon_orders ao ON ao.id = aoi.order_id
       WHERE sba.batch_id = b.id)
      - b.actual_arrival
    ))
    ELSE NULL
  END AS days_to_deplete,

  b.supplier_id,
  s.name AS supplier_name

FROM batches b
LEFT JOIN suppliers s ON s.id = b.supplier_id
WHERE b.stage = 'amazon'
ORDER BY b.ordered_date ASC;

-- =============================================================================
-- COGS CALCULATION FUNCTION
-- =============================================================================

-- Calculate COGS for a product and period using specified settings
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
  v_product_cost DECIMAL;
  v_transfer_cost DECIMAL;
  v_inbound_fees DECIMAL;
  v_fba_fees DECIMAL;
  v_storage_fees DECIMAL;
  v_awd_fees DECIMAL;
  v_inv_losses DECIMAL;
  v_units_sold BIGINT;
BEGIN
  -- Get settings
  SELECT * INTO v_settings FROM get_cogs_settings(p_settings_name);

  RETURN QUERY
  WITH sales_data AS (
    SELECT
      aoi.internal_product_id,
      SUM(aoi.quantity_shipped) AS units,
      SUM(sba.total_cost) AS prod_cost
    FROM amazon_order_items aoi
    JOIN amazon_orders ao ON ao.id = aoi.order_id
    LEFT JOIN sales_batch_attributions sba ON sba.order_item_id = aoi.id
    WHERE ao.ship_date >= p_start_date
      AND ao.ship_date <= p_end_date
      AND ao.status IN ('shipped', 'delivered')
      AND (p_product_id IS NULL OR aoi.internal_product_id = p_product_id)
    GROUP BY aoi.internal_product_id
  ),
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
    0::DECIMAL AS transfer_cost,  -- TODO: Calculate from transfers
    COALESCE(fd.inbound, 0) AS inbound_fees,
    COALESCE(fd.fba, 0) AS fba_fees,
    COALESCE(fd.storage, 0) AS storage_fees,
    COALESCE(fd.awd, 0) AS awd_fees,
    COALESCE(ld.losses, 0) AS inventory_losses,
    (COALESCE(sd.prod_cost, 0) + COALESCE(fd.inbound, 0) + COALESCE(fd.fba, 0) +
     COALESCE(fd.storage, 0) + COALESCE(fd.awd, 0) + COALESCE(ld.losses, 0)) AS total_cogs,
    CASE
      WHEN COALESCE(sd.units, 0) > 0 THEN
        (COALESCE(sd.prod_cost, 0) + COALESCE(fd.inbound, 0) + COALESCE(fd.fba, 0) +
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
-- COGS SUMMARY VIEW
-- =============================================================================

-- Overall COGS summary by month
CREATE OR REPLACE VIEW cogs_monthly_summary AS
SELECT
  DATE_TRUNC('month', ao.ship_date) AS month,
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
  DATE_TRUNC('month', ao.ship_date),
  ao.marketplace
ORDER BY month DESC, marketplace;

-- =============================================================================
-- UNATTRIBUTED SALES VIEW
-- =============================================================================

-- Sales that couldn't be attributed to batches (inventory mismatch)
CREATE OR REPLACE VIEW unattributed_sales AS
SELECT
  aoi.id AS order_item_id,
  ao.amazon_order_id,
  ao.ship_date,
  aoi.seller_sku,
  aoi.quantity_shipped AS requested_quantity,
  COALESCE((
    SELECT SUM(sba.quantity) FROM sales_batch_attributions sba WHERE sba.order_item_id = aoi.id
  ), 0) AS attributed_quantity,
  aoi.quantity_shipped - COALESCE((
    SELECT SUM(sba.quantity) FROM sales_batch_attributions sba WHERE sba.order_item_id = aoi.id
  ), 0) AS unattributed_quantity,
  aoi.internal_product_id,
  p.name AS product_name,
  ao.marketplace
FROM amazon_order_items aoi
JOIN amazon_orders ao ON ao.id = aoi.order_id
LEFT JOIN products p ON p.id = aoi.internal_product_id
WHERE aoi.cogs_calculated = true
  AND aoi.quantity_shipped > COALESCE((
    SELECT SUM(sba.quantity) FROM sales_batch_attributions sba WHERE sba.order_item_id = aoi.id
  ), 0)
ORDER BY ao.ship_date DESC;
