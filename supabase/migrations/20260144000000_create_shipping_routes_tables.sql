-- Migration: Create shipping_legs and shipping_routes tables
-- Part of Settings section implementation

-- =============================================================================
-- SHIPPING LEGS TABLE
-- Individual point-to-point shipping segments that can be reused across routes
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipping_legs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,

  -- Origin and destination by location TYPE (not specific location)
  from_location_type location_type NOT NULL,
  from_location_name VARCHAR(255) NOT NULL,  -- Display name (e.g., "Factory", "3PL Warehouse")
  to_location_type location_type NOT NULL,
  to_location_name VARCHAR(255) NOT NULL,

  -- Shipping method (uses existing enum)
  method shipping_method NOT NULL,

  -- Transit time range
  transit_days_min INT NOT NULL CHECK (transit_days_min >= 0),
  transit_days_typical INT NOT NULL CHECK (transit_days_typical >= transit_days_min),
  transit_days_max INT NOT NULL CHECK (transit_days_max >= transit_days_typical),

  -- Costs (at least one should be set)
  cost_per_unit DECIMAL(10, 2),
  cost_per_kg DECIMAL(10, 2),
  cost_flat_fee DECIMAL(10, 2),
  cost_currency CHAR(3) NOT NULL DEFAULT 'USD',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for shipping_legs
CREATE INDEX IF NOT EXISTS idx_shipping_legs_from_type ON shipping_legs(from_location_type);
CREATE INDEX IF NOT EXISTS idx_shipping_legs_to_type ON shipping_legs(to_location_type);
CREATE INDEX IF NOT EXISTS idx_shipping_legs_active ON shipping_legs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_legs_method ON shipping_legs(method);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_shipping_legs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_legs_updated_at
  BEFORE UPDATE ON shipping_legs
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_legs_updated_at();

-- =============================================================================
-- SHIPPING ROUTES TABLE
-- Composed journeys using multiple legs in sequence
-- =============================================================================

CREATE TABLE IF NOT EXISTS shipping_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,

  -- Ordered array of leg IDs (first leg's from = route origin, last leg's to = route destination)
  leg_ids UUID[] NOT NULL,

  -- Computed fields stored for quick access (updated via trigger)
  origin_location_type location_type,
  destination_location_type location_type,

  -- Status flags
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for shipping_routes
CREATE INDEX IF NOT EXISTS idx_shipping_routes_active ON shipping_routes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_routes_default ON shipping_routes(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_shipping_routes_origin_dest ON shipping_routes(origin_location_type, destination_location_type);

-- Partial unique constraint: only one default per origin-destination type pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_routes_unique_default
  ON shipping_routes(origin_location_type, destination_location_type)
  WHERE is_default = true AND is_active = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_shipping_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_routes_updated_at
  BEFORE UPDATE ON shipping_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_routes_updated_at();

-- =============================================================================
-- FUNCTION: Update route origin/destination from legs
-- Called before insert/update to compute origin and destination from leg_ids
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_route_endpoints()
RETURNS TRIGGER AS $$
DECLARE
  first_leg shipping_legs%ROWTYPE;
  last_leg shipping_legs%ROWTYPE;
  first_leg_id UUID;
  last_leg_id UUID;
BEGIN
  -- Get first and last leg IDs from array
  IF array_length(NEW.leg_ids, 1) > 0 THEN
    first_leg_id := NEW.leg_ids[1];
    last_leg_id := NEW.leg_ids[array_length(NEW.leg_ids, 1)];

    -- Fetch first leg for origin
    SELECT * INTO first_leg FROM shipping_legs WHERE id = first_leg_id;
    IF FOUND THEN
      NEW.origin_location_type := first_leg.from_location_type;
    END IF;

    -- Fetch last leg for destination
    SELECT * INTO last_leg FROM shipping_legs WHERE id = last_leg_id;
    IF FOUND THEN
      NEW.destination_location_type := last_leg.to_location_type;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_routes_compute_endpoints
  BEFORE INSERT OR UPDATE OF leg_ids ON shipping_routes
  FOR EACH ROW
  EXECUTE FUNCTION compute_route_endpoints();

-- =============================================================================
-- FUNCTION: Clear other defaults when setting a new default
-- =============================================================================

CREATE OR REPLACE FUNCTION clear_other_default_routes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when setting is_default to true
  IF NEW.is_default = true AND (OLD IS NULL OR OLD.is_default = false) THEN
    -- Clear is_default for other routes with same origin-destination pair
    UPDATE shipping_routes
    SET is_default = false
    WHERE id != NEW.id
      AND origin_location_type = NEW.origin_location_type
      AND destination_location_type = NEW.destination_location_type
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shipping_routes_clear_other_defaults
  BEFORE INSERT OR UPDATE OF is_default ON shipping_routes
  FOR EACH ROW
  EXECUTE FUNCTION clear_other_default_routes();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_routes ENABLE ROW LEVEL SECURITY;

-- Shipping legs policies (org-level, all authenticated users)
CREATE POLICY "Authenticated users can view shipping legs"
  ON shipping_legs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shipping legs"
  ON shipping_legs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping legs"
  ON shipping_legs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shipping legs"
  ON shipping_legs FOR DELETE
  TO authenticated
  USING (true);

-- Shipping routes policies (org-level, all authenticated users)
CREATE POLICY "Authenticated users can view shipping routes"
  ON shipping_routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create shipping routes"
  ON shipping_routes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping routes"
  ON shipping_routes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shipping routes"
  ON shipping_routes FOR DELETE
  TO authenticated
  USING (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE shipping_legs IS 'Individual point-to-point shipping segments between location types';
COMMENT ON TABLE shipping_routes IS 'Composed shipping journeys using multiple legs in sequence';
COMMENT ON COLUMN shipping_legs.from_location_type IS 'Origin location type (factory, warehouse, 3pl, amazon_fba, amazon_awd, port, customs)';
COMMENT ON COLUMN shipping_legs.to_location_type IS 'Destination location type';
COMMENT ON COLUMN shipping_routes.leg_ids IS 'Ordered array of leg UUIDs forming the route';
COMMENT ON COLUMN shipping_routes.is_default IS 'Whether this is the default route for its origin-destination pair';
