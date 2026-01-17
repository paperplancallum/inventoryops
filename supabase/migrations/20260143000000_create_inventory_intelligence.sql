-- Inventory Intelligence System Tables
-- Provides sales forecasting, safety stock rules, shipping routes, and replenishment suggestions

-- =============================================================================
-- SHIPPING ROUTE LEGS - Individual point-to-point shipping segments
-- =============================================================================

CREATE TYPE shipping_method AS ENUM ('sea', 'air', 'ground', 'express', 'rail');

CREATE TABLE shipping_route_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id), -- Can be NULL for category-based destinations
  to_location_type TEXT, -- 'factory', 'warehouse', '3pl', 'amazon-fba', 'amazon-awd', 'port', 'customs'
  method shipping_method NOT NULL DEFAULT 'sea',
  transit_days_min INTEGER NOT NULL DEFAULT 7,
  transit_days_typical INTEGER NOT NULL DEFAULT 14,
  transit_days_max INTEGER NOT NULL DEFAULT 21,
  cost_per_unit DECIMAL(10,2),
  cost_per_kg DECIMAL(10,2),
  cost_flat_fee DECIMAL(10,2),
  cost_currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipping_route_legs_from ON shipping_route_legs(from_location_id);
CREATE INDEX idx_shipping_route_legs_to ON shipping_route_legs(to_location_id);
CREATE INDEX idx_shipping_route_legs_active ON shipping_route_legs(is_active);

-- =============================================================================
-- SHIPPING ROUTES - Composed routes from multiple legs
-- =============================================================================

CREATE TABLE shipping_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leg_ids UUID[] NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipping_routes_default ON shipping_routes(is_default);
CREATE INDEX idx_shipping_routes_active ON shipping_routes(is_active);

-- =============================================================================
-- SAFETY STOCK RULES - Per product/location thresholds
-- =============================================================================

CREATE TYPE threshold_type AS ENUM ('units', 'days-of-cover');

CREATE TABLE safety_stock_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  threshold_type threshold_type NOT NULL DEFAULT 'days-of-cover',
  threshold_value DECIMAL(10,2) NOT NULL DEFAULT 14,
  seasonal_multipliers JSONB NOT NULL DEFAULT '[]', -- Array of {month, multiplier}
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

CREATE INDEX idx_safety_stock_rules_product ON safety_stock_rules(product_id);
CREATE INDEX idx_safety_stock_rules_location ON safety_stock_rules(location_id);
CREATE INDEX idx_safety_stock_rules_active ON safety_stock_rules(is_active);

-- =============================================================================
-- SALES HISTORY - Historical sales data for forecasting
-- =============================================================================

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id, date)
);

CREATE INDEX idx_sales_history_product ON sales_history(product_id);
CREATE INDEX idx_sales_history_location ON sales_history(location_id);
CREATE INDEX idx_sales_history_date ON sales_history(date);
CREATE INDEX idx_sales_history_product_date ON sales_history(product_id, date DESC);

-- =============================================================================
-- FORECAST ADJUSTMENTS - Account and product-level adjustments
-- =============================================================================

CREATE TYPE adjustment_effect AS ENUM ('exclude', 'multiply');

CREATE TABLE account_forecast_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  effect adjustment_effect NOT NULL DEFAULT 'exclude',
  multiplier DECIMAL(5,2), -- For 'multiply' effect, e.g., 1.5 = +50%
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_forecast_adjustments_dates ON account_forecast_adjustments(start_date, end_date);

CREATE TABLE product_forecast_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  account_adjustment_id UUID REFERENCES account_forecast_adjustments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  effect adjustment_effect NOT NULL DEFAULT 'exclude',
  multiplier DECIMAL(5,2),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_opted_out BOOLEAN NOT NULL DEFAULT false, -- If true, product ignores the account adjustment
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_forecast_adjustments_product ON product_forecast_adjustments(product_id);
CREATE INDEX idx_product_forecast_adjustments_account ON product_forecast_adjustments(account_adjustment_id);

-- =============================================================================
-- SALES FORECASTS - Per product/location forecast configuration
-- =============================================================================

CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');

CREATE TABLE sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  confidence confidence_level NOT NULL DEFAULT 'medium',
  accuracy_mape DECIMAL(5,2), -- Mean Absolute Percentage Error
  manual_override DECIMAL(10,2), -- User-set override
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  seasonal_multipliers DECIMAL(5,2)[] NOT NULL DEFAULT '{1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0}', -- 12 values for months
  trend_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- Monthly growth rate
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

CREATE INDEX idx_sales_forecasts_product ON sales_forecasts(product_id);
CREATE INDEX idx_sales_forecasts_location ON sales_forecasts(location_id);
CREATE INDEX idx_sales_forecasts_enabled ON sales_forecasts(is_enabled);

-- =============================================================================
-- REPLENISHMENT SUGGESTIONS - Generated transfer and PO suggestions
-- =============================================================================

CREATE TYPE suggestion_type AS ENUM ('transfer', 'purchase-order');
CREATE TYPE suggestion_urgency AS ENUM ('critical', 'warning', 'planned', 'monitor');
CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'dismissed', 'snoozed');

CREATE TABLE replenishment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type suggestion_type NOT NULL,
  urgency suggestion_urgency NOT NULL DEFAULT 'monitor',
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
  days_of_stock_remaining INTEGER NOT NULL DEFAULT 0,
  stockout_date DATE,
  safety_stock_threshold INTEGER NOT NULL DEFAULT 0,

  -- Recommendation
  recommended_qty INTEGER NOT NULL DEFAULT 0,
  estimated_arrival DATE,

  -- Source (for transfers)
  source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  source_available_qty INTEGER,

  -- Supplier (for POs)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_lead_time_days INTEGER,

  -- Route information
  route_id UUID REFERENCES shipping_routes(id) ON DELETE SET NULL,
  route_method shipping_method,
  route_transit_days INTEGER,

  -- Reasoning (stored as JSONB array)
  reasoning JSONB NOT NULL DEFAULT '[]',

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snoozed_until TIMESTAMPTZ,
  dismissed_reason TEXT,
  accepted_at TIMESTAMPTZ,
  linked_entity_id UUID,
  linked_entity_type TEXT, -- 'transfer' or 'purchase-order'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_replenishment_suggestions_type ON replenishment_suggestions(type);
CREATE INDEX idx_replenishment_suggestions_urgency ON replenishment_suggestions(urgency);
CREATE INDEX idx_replenishment_suggestions_status ON replenishment_suggestions(status);
CREATE INDEX idx_replenishment_suggestions_product ON replenishment_suggestions(product_id);
CREATE INDEX idx_replenishment_suggestions_destination ON replenishment_suggestions(destination_location_id);
CREATE INDEX idx_replenishment_suggestions_pending ON replenishment_suggestions(status) WHERE status = 'pending';

-- =============================================================================
-- INTELLIGENCE SETTINGS - Account-level configuration
-- =============================================================================

CREATE TABLE intelligence_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critical_days INTEGER NOT NULL DEFAULT 3,
  warning_days INTEGER NOT NULL DEFAULT 7,
  planned_days INTEGER NOT NULL DEFAULT 14,
  auto_refresh_interval_minutes INTEGER NOT NULL DEFAULT 60,
  default_safety_stock_days INTEGER NOT NULL DEFAULT 14,
  include_in_transit_in_calculations BOOLEAN NOT NULL DEFAULT true,
  notify_on_critical BOOLEAN NOT NULL DEFAULT true,
  notify_on_warning BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO intelligence_settings (id) VALUES (gen_random_uuid());

-- =============================================================================
-- NOTIFICATIONS - In-app alerts for critical inventory events
-- =============================================================================

CREATE TYPE notification_type AS ENUM ('critical_stock', 'warning_stock', 'suggestion_accepted', 'suggestion_expired', 'forecast_updated');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'dismissed');

CREATE TABLE inventory_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'unread',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT, -- 'suggestion', 'product', 'location'
  entity_id UUID,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

CREATE INDEX idx_inventory_notifications_status ON inventory_notifications(status);
CREATE INDEX idx_inventory_notifications_type ON inventory_notifications(type);
CREATE INDEX idx_inventory_notifications_unread ON inventory_notifications(status) WHERE status = 'unread';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_route_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_stock_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_forecast_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_forecast_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replenishment_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (any authenticated user can access)
CREATE POLICY "Authenticated users can manage shipping_route_legs"
  ON shipping_route_legs FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage shipping_routes"
  ON shipping_routes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage safety_stock_rules"
  ON safety_stock_rules FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sales_history"
  ON sales_history FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage account_forecast_adjustments"
  ON account_forecast_adjustments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage product_forecast_adjustments"
  ON product_forecast_adjustments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sales_forecasts"
  ON sales_forecasts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage replenishment_suggestions"
  ON replenishment_suggestions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage intelligence_settings"
  ON intelligence_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage inventory_notifications"
  ON inventory_notifications FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER update_shipping_route_legs_updated_at
  BEFORE UPDATE ON shipping_route_legs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_routes_updated_at
  BEFORE UPDATE ON shipping_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_stock_rules_updated_at
  BEFORE UPDATE ON safety_stock_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_forecast_adjustments_updated_at
  BEFORE UPDATE ON account_forecast_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_forecast_adjustments_updated_at
  BEFORE UPDATE ON product_forecast_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_forecasts_updated_at
  BEFORE UPDATE ON sales_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_replenishment_suggestions_updated_at
  BEFORE UPDATE ON replenishment_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_settings_updated_at
  BEFORE UPDATE ON intelligence_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
