-- Inventory Intelligence Tables
-- Shipping routes, sales forecasts, safety stock rules, suggestions, and settings

-- ============================================================================
-- Shipping Routes
-- Pre-configured routes between locations with transit times and costs
-- ============================================================================

CREATE TYPE shipping_method AS ENUM ('sea', 'air', 'ground', 'express', 'rail');

CREATE TABLE shipping_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  from_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  to_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  method shipping_method NOT NULL,
  transit_days_min INTEGER NOT NULL DEFAULT 1,
  transit_days_typical INTEGER NOT NULL DEFAULT 1,
  transit_days_max INTEGER NOT NULL DEFAULT 1,
  cost_per_unit DECIMAL(10,2),
  cost_per_kg DECIMAL(10,2),
  cost_flat_fee DECIMAL(10,2),
  cost_currency TEXT NOT NULL DEFAULT 'USD',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_transit_days CHECK (
    transit_days_min > 0 AND
    transit_days_typical >= transit_days_min AND
    transit_days_max >= transit_days_typical
  ),
  CONSTRAINT different_locations CHECK (from_location_id != to_location_id)
);

-- Ensure only one default route per from/to pair
CREATE UNIQUE INDEX shipping_routes_default_unique
  ON shipping_routes (from_location_id, to_location_id)
  WHERE is_default = true;

CREATE INDEX shipping_routes_from_location ON shipping_routes(from_location_id);
CREATE INDEX shipping_routes_to_location ON shipping_routes(to_location_id);
CREATE INDEX shipping_routes_active ON shipping_routes(is_active) WHERE is_active = true;

-- ============================================================================
-- Sales History
-- Historical sales data per product per location (from Amazon API or manual)
-- ============================================================================

CREATE TYPE sales_history_source AS ENUM ('amazon-api', 'manual', 'imported');

CREATE TABLE sales_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  units_sold INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  source sales_history_source NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_units CHECK (units_sold >= 0),
  CONSTRAINT positive_revenue CHECK (revenue >= 0)
);

-- One entry per product/location/date
CREATE UNIQUE INDEX sales_history_unique ON sales_history(product_id, location_id, date);
CREATE INDEX sales_history_product ON sales_history(product_id);
CREATE INDEX sales_history_location ON sales_history(location_id);
CREATE INDEX sales_history_date ON sales_history(date);
CREATE INDEX sales_history_product_location_date ON sales_history(product_id, location_id, date DESC);

-- ============================================================================
-- Safety Stock Rules
-- Minimum inventory thresholds per product/location
-- ============================================================================

CREATE TYPE threshold_type AS ENUM ('units', 'days-of-cover');

CREATE TABLE safety_stock_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  threshold_type threshold_type NOT NULL DEFAULT 'days-of-cover',
  threshold_value INTEGER NOT NULL DEFAULT 30, -- 30 days default
  seasonal_multipliers JSONB NOT NULL DEFAULT '[]', -- [{month: 11, multiplier: 1.5}, ...]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_threshold CHECK (threshold_value > 0)
);

-- One rule per product/location
CREATE UNIQUE INDEX safety_stock_rules_unique ON safety_stock_rules(product_id, location_id);
CREATE INDEX safety_stock_rules_product ON safety_stock_rules(product_id);
CREATE INDEX safety_stock_rules_location ON safety_stock_rules(location_id);
CREATE INDEX safety_stock_rules_active ON safety_stock_rules(is_active) WHERE is_active = true;

-- ============================================================================
-- Account Forecast Adjustments
-- Account-level adjustments that apply to all products by default
-- ============================================================================

CREATE TYPE adjustment_effect AS ENUM ('exclude', 'multiply');

CREATE TABLE account_forecast_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  effect adjustment_effect NOT NULL,
  multiplier DECIMAL(5,2), -- Required if effect='multiply', e.g., 1.5 = +50%
  is_recurring BOOLEAN NOT NULL DEFAULT false, -- Repeats yearly
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT multiplier_required_for_multiply CHECK (
    effect != 'multiply' OR multiplier IS NOT NULL
  ),
  CONSTRAINT positive_multiplier CHECK (multiplier IS NULL OR multiplier > 0)
);

CREATE INDEX account_forecast_adjustments_dates ON account_forecast_adjustments(start_date, end_date);

-- ============================================================================
-- Sales Forecasts
-- Simplified daily sales rate per product per location
-- ============================================================================

CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TABLE sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  accuracy_mape DECIMAL(5,2), -- Mean Absolute Percentage Error
  manual_override DECIMAL(10,2), -- If user manually sets rate
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  seasonal_multipliers JSONB NOT NULL DEFAULT '[1,1,1,1,1,1,1,1,1,1,1,1]', -- 12 values for months
  trend_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- Monthly growth rate, e.g., 0.02 = 2%
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_daily_rate CHECK (daily_rate >= 0),
  CONSTRAINT valid_mape CHECK (accuracy_mape IS NULL OR accuracy_mape >= 0)
);

-- One forecast per product/location
CREATE UNIQUE INDEX sales_forecasts_unique ON sales_forecasts(product_id, location_id);
CREATE INDEX sales_forecasts_product ON sales_forecasts(product_id);
CREATE INDEX sales_forecasts_location ON sales_forecasts(location_id);
CREATE INDEX sales_forecasts_enabled ON sales_forecasts(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- Product Forecast Adjustments
-- Product-specific adjustments that can override or opt-out of account adjustments
-- ============================================================================

CREATE TABLE product_forecast_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES sales_forecasts(id) ON DELETE CASCADE,
  account_adjustment_id UUID REFERENCES account_forecast_adjustments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  effect adjustment_effect NOT NULL,
  multiplier DECIMAL(5,2),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_opted_out BOOLEAN NOT NULL DEFAULT false, -- If true, ignores the account adjustment
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT multiplier_required_for_multiply CHECK (
    effect != 'multiply' OR multiplier IS NOT NULL OR is_opted_out = true
  ),
  CONSTRAINT positive_multiplier CHECK (multiplier IS NULL OR multiplier > 0)
);

CREATE INDEX product_forecast_adjustments_forecast ON product_forecast_adjustments(forecast_id);
CREATE INDEX product_forecast_adjustments_account ON product_forecast_adjustments(account_adjustment_id);

-- ============================================================================
-- Replenishment Suggestions
-- Generated recommendations for transfers or purchase orders
-- ============================================================================

CREATE TYPE suggestion_type AS ENUM ('transfer', 'purchase-order');
CREATE TYPE suggestion_urgency AS ENUM ('critical', 'warning', 'planned', 'monitor');
CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'dismissed', 'snoozed');

CREATE TABLE replenishment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type suggestion_type NOT NULL,
  urgency suggestion_urgency NOT NULL,
  status suggestion_status NOT NULL DEFAULT 'pending',

  -- Product information
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Destination (usually Amazon location)
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Current state at destination
  current_stock INTEGER NOT NULL DEFAULT 0,
  in_transit_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER NOT NULL DEFAULT 0,

  -- Sales and coverage
  daily_sales_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  weekly_sales_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  days_of_stock_remaining INTEGER,
  stockout_date DATE,
  safety_stock_threshold INTEGER NOT NULL DEFAULT 0,

  -- Recommendation
  recommended_qty INTEGER NOT NULL,
  estimated_arrival DATE,

  -- Source (for transfers)
  source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  source_available_qty INTEGER,

  -- Supplier (for POs)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_lead_time_days INTEGER,

  -- Route information
  route_id UUID REFERENCES shipping_routes(id) ON DELETE SET NULL,
  route_transit_days INTEGER,

  -- Reasoning (stored as JSON array)
  reasoning JSONB NOT NULL DEFAULT '[]', -- [{type, message, value}, ...]

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  snoozed_until TIMESTAMPTZ,
  dismissed_reason TEXT,
  accepted_at TIMESTAMPTZ,
  linked_entity_id UUID, -- ID of created transfer or PO
  linked_entity_type TEXT, -- 'transfer' or 'purchase-order'

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_stock CHECK (current_stock >= 0),
  CONSTRAINT positive_recommended CHECK (recommended_qty > 0)
);

CREATE INDEX suggestions_status ON replenishment_suggestions(status);
CREATE INDEX suggestions_urgency ON replenishment_suggestions(urgency);
CREATE INDEX suggestions_product ON replenishment_suggestions(product_id);
CREATE INDEX suggestions_destination ON replenishment_suggestions(destination_location_id);
CREATE INDEX suggestions_pending ON replenishment_suggestions(status, urgency)
  WHERE status = 'pending';
CREATE INDEX suggestions_type ON replenishment_suggestions(type);

-- ============================================================================
-- Intelligence Settings
-- Global settings for the intelligence system
-- ============================================================================

CREATE TABLE intelligence_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Urgency thresholds (days)
  critical_threshold_days INTEGER NOT NULL DEFAULT 7,
  warning_threshold_days INTEGER NOT NULL DEFAULT 14,
  planned_threshold_days INTEGER NOT NULL DEFAULT 30,

  -- Calculation settings
  auto_refresh_interval_minutes INTEGER NOT NULL DEFAULT 60,
  default_safety_stock_days INTEGER NOT NULL DEFAULT 30,
  include_in_transit_in_calculations BOOLEAN NOT NULL DEFAULT true,

  -- Notification settings
  notify_on_critical BOOLEAN NOT NULL DEFAULT true,
  notify_on_warning BOOLEAN NOT NULL DEFAULT false,

  -- Singleton enforcement
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT positive_thresholds CHECK (
    critical_threshold_days > 0 AND
    warning_threshold_days > critical_threshold_days AND
    planned_threshold_days > warning_threshold_days
  )
);

-- Ensure only one active settings row (singleton pattern)
CREATE UNIQUE INDEX intelligence_settings_singleton ON intelligence_settings(is_active) WHERE is_active = true;

-- Insert default settings
INSERT INTO intelligence_settings (
  critical_threshold_days,
  warning_threshold_days,
  planned_threshold_days,
  default_safety_stock_days,
  include_in_transit_in_calculations
) VALUES (7, 14, 30, 30, true);

-- ============================================================================
-- Updated_at Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_routes_updated_at
  BEFORE UPDATE ON shipping_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER safety_stock_rules_updated_at
  BEFORE UPDATE ON safety_stock_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER account_forecast_adjustments_updated_at
  BEFORE UPDATE ON account_forecast_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sales_forecasts_updated_at
  BEFORE UPDATE ON sales_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER product_forecast_adjustments_updated_at
  BEFORE UPDATE ON product_forecast_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER replenishment_suggestions_updated_at
  BEFORE UPDATE ON replenishment_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER intelligence_settings_updated_at
  BEFORE UPDATE ON intelligence_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE shipping_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_stock_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_forecast_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_forecast_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE replenishment_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do everything (single-tenant app)
CREATE POLICY "Authenticated users can manage shipping_routes"
  ON shipping_routes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sales_history"
  ON sales_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage safety_stock_rules"
  ON safety_stock_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage account_forecast_adjustments"
  ON account_forecast_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sales_forecasts"
  ON sales_forecasts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage product_forecast_adjustments"
  ON product_forecast_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage replenishment_suggestions"
  ON replenishment_suggestions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage intelligence_settings"
  ON intelligence_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role for edge functions
CREATE POLICY "Service role can manage shipping_routes"
  ON shipping_routes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage sales_history"
  ON sales_history FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage safety_stock_rules"
  ON safety_stock_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage account_forecast_adjustments"
  ON account_forecast_adjustments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage sales_forecasts"
  ON sales_forecasts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage product_forecast_adjustments"
  ON product_forecast_adjustments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage replenishment_suggestions"
  ON replenishment_suggestions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage intelligence_settings"
  ON intelligence_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
