-- Shipping Quotes Migration
-- Creates tables for shipping quote requests and tracking

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Shipping quote status enum
CREATE TYPE shipping_quote_status AS ENUM (
  'pending',     -- Quote requested, awaiting agent response
  'submitted',   -- Agent has submitted their quote
  'selected',    -- This quote was selected as the winner
  'rejected'     -- Quote was not selected (another was chosen)
);

-- =============================================================================
-- SHIPPING QUOTES TABLE
-- =============================================================================

CREATE TABLE shipping_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shipping agent (who is providing the quote)
  shipping_agent_id UUID NOT NULL REFERENCES shipping_agents(id) ON DELETE RESTRICT,

  -- Magic link for agent portal access
  magic_link_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,

  -- Status tracking
  status shipping_quote_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,

  -- Quote details
  valid_until DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  total_amount NUMERIC(12, 2),
  notes TEXT,

  -- PDF attachment
  pdf_path TEXT,

  -- Created by (null if submitted via portal)
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_shipping_quotes_agent ON shipping_quotes(shipping_agent_id);
CREATE INDEX idx_shipping_quotes_status ON shipping_quotes(status);
CREATE INDEX idx_shipping_quotes_magic_link ON shipping_quotes(magic_link_token) WHERE magic_link_token IS NOT NULL;
CREATE INDEX idx_shipping_quotes_created_at ON shipping_quotes(created_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER shipping_quotes_updated_at
  BEFORE UPDATE ON shipping_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view shipping_quotes"
  ON shipping_quotes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert shipping_quotes"
  ON shipping_quotes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping_quotes"
  ON shipping_quotes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete shipping_quotes"
  ON shipping_quotes FOR DELETE TO authenticated USING (true);

-- Anonymous users can view/update quotes via magic link token
-- This is needed for the agent portal
CREATE POLICY "Anon users can view quotes with valid token"
  ON shipping_quotes FOR SELECT TO anon
  USING (
    magic_link_token IS NOT NULL
    AND token_expires_at > NOW()
  );

CREATE POLICY "Anon users can update quotes with valid token"
  ON shipping_quotes FOR UPDATE TO anon
  USING (
    magic_link_token IS NOT NULL
    AND token_expires_at > NOW()
    AND status = 'pending'
  )
  WITH CHECK (
    magic_link_token IS NOT NULL
    AND token_expires_at > NOW()
  );
