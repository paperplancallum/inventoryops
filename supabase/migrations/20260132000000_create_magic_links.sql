-- Magic Links Migration
-- Creates tables for secure tokenized URLs enabling external stakeholder interaction

-- =============================================================================
-- TYPES (ENUMS)
-- =============================================================================

-- Magic link entity type enum
CREATE TYPE magic_link_entity_type AS ENUM (
  'purchase-order',
  'transfer'
);

-- Magic link purpose enum
CREATE TYPE magic_link_purpose AS ENUM (
  'invoice-submission',
  'document-upload'
);

-- Magic link status enum
CREATE TYPE magic_link_status AS ENUM (
  'active',
  'submitted',
  'expired',
  'revoked'
);

-- Magic link event type enum
CREATE TYPE magic_link_event_type AS ENUM (
  'created',
  'sent',
  'reminder_sent',
  'viewed',
  'form_started',
  'validation_error',
  'submitted',
  'expired',
  'revoked',
  'regenerated'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Magic Links
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token (stored as hash for security - raw token shown only once)
  token_hash TEXT NOT NULL UNIQUE,

  -- Polymorphic relationship to parent entity
  linked_entity_type magic_link_entity_type NOT NULL,
  linked_entity_id UUID NOT NULL,
  linked_entity_name TEXT NOT NULL,  -- Denormalized for display (e.g., "PO-2024-0042")

  -- Purpose and permissions
  purpose magic_link_purpose NOT NULL,

  -- Status tracking
  status magic_link_status NOT NULL DEFAULT 'active',

  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Tracking timestamps (denormalized from events for queries)
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- External party context
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL DEFAULT 'External User',

  -- Optional custom message included in email
  custom_message TEXT,

  -- Audit trail
  created_by_user_id UUID,
  created_by_user_name TEXT,

  -- Submission data (populated after successful submission)
  submission_data JSONB,

  -- Internal notes (not visible to external party)
  notes TEXT,

  -- For regenerated links, reference to the original
  regenerated_from_id UUID REFERENCES magic_links(id) ON DELETE SET NULL,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Magic Link Events (immutable audit trail)
CREATE TABLE magic_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magic_link_id UUID NOT NULL REFERENCES magic_links(id) ON DELETE CASCADE,
  event_type magic_link_event_type NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Request context (captured when event occurs)
  ip_address TEXT,           -- Anonymized for privacy (last octet masked)
  user_agent TEXT,           -- Browser/client identification

  -- Optional metadata (varies by event type)
  metadata JSONB DEFAULT '{}',

  -- For internal events: who triggered it
  triggered_by_user_id UUID,
  triggered_by_user_name TEXT
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Magic links indexes
CREATE INDEX idx_magic_links_token_hash ON magic_links(token_hash);
CREATE INDEX idx_magic_links_status ON magic_links(status);
CREATE INDEX idx_magic_links_linked_entity ON magic_links(linked_entity_type, linked_entity_id);
CREATE INDEX idx_magic_links_purpose ON magic_links(purpose);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);
CREATE INDEX idx_magic_links_recipient_email ON magic_links(recipient_email);
CREATE INDEX idx_magic_links_created_at ON magic_links(created_at DESC);

-- For finding active links that need expiry processing
CREATE INDEX idx_magic_links_active_expiring ON magic_links(expires_at)
  WHERE status = 'active';

-- Magic link events indexes
CREATE INDEX idx_magic_link_events_link ON magic_link_events(magic_link_id);
CREATE INDEX idx_magic_link_events_type ON magic_link_events(event_type);
CREATE INDEX idx_magic_link_events_timestamp ON magic_link_events(timestamp DESC);

-- =============================================================================
-- TRIGGERS - Auto-update timestamps
-- =============================================================================

CREATE TRIGGER magic_links_updated_at
  BEFORE UPDATE ON magic_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGERS - Auto-expire links
-- =============================================================================

CREATE OR REPLACE FUNCTION check_magic_link_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If link is active and expiry date has passed, mark as expired
  IF NEW.status = 'active' AND NEW.expires_at < NOW() THEN
    NEW.status := 'expired';

    -- Log expiry event
    INSERT INTO magic_link_events (
      magic_link_id,
      event_type,
      metadata
    ) VALUES (
      NEW.id,
      'expired',
      '{"auto": true}'::JSONB
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER magic_links_check_expiry
  BEFORE UPDATE ON magic_links
  FOR EACH ROW
  EXECUTE FUNCTION check_magic_link_expiry();

-- =============================================================================
-- FUNCTION - Expire all overdue links (for scheduled job)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_overdue_magic_links()
RETURNS INT AS $$
DECLARE
  expired_count INT;
BEGIN
  WITH expired AS (
    UPDATE magic_links
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING id
  ),
  events AS (
    INSERT INTO magic_link_events (magic_link_id, event_type, metadata)
    SELECT id, 'expired', '{"auto": true}'::JSONB
    FROM expired
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION - Get magic links needing expiry reminders
-- =============================================================================

CREATE OR REPLACE FUNCTION get_magic_links_needing_reminder(days_before INT)
RETURNS TABLE (
  id UUID,
  recipient_email TEXT,
  recipient_name TEXT,
  linked_entity_name TEXT,
  purpose magic_link_purpose,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ml.id,
    ml.recipient_email,
    ml.recipient_name,
    ml.linked_entity_name,
    ml.purpose,
    ml.expires_at
  FROM magic_links ml
  WHERE ml.status = 'active'
    AND ml.expires_at > NOW()
    AND ml.expires_at <= NOW() + (days_before || ' days')::INTERVAL
    AND NOT EXISTS (
      -- Check if reminder already sent for this period
      SELECT 1 FROM magic_link_events mle
      WHERE mle.magic_link_id = ml.id
        AND mle.event_type = 'reminder_sent'
        AND mle.timestamp > NOW() - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEW - Magic Links Summary
-- =============================================================================

CREATE OR REPLACE VIEW magic_links_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active')::INT AS total_active,
  COUNT(*) FILTER (WHERE status = 'active' AND sent_at IS NOT NULL AND submitted_at IS NULL)::INT AS pending_submission,
  COUNT(*) FILTER (WHERE status = 'submitted' AND submitted_at > NOW() - INTERVAL '7 days')::INT AS submitted_this_week,
  COUNT(*) FILTER (WHERE status = 'active' AND expires_at <= NOW() + INTERVAL '24 hours')::INT AS expiring_within_24_hours
FROM magic_links;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_events ENABLE ROW LEVEL SECURITY;

-- Magic links policies for authenticated users (internal management)
CREATE POLICY "Authenticated users can view magic_links"
  ON magic_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert magic_links"
  ON magic_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update magic_links"
  ON magic_links FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete magic_links"
  ON magic_links FOR DELETE
  TO authenticated
  USING (true);

-- Magic link events policies
CREATE POLICY "Authenticated users can view magic_link_events"
  ON magic_link_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert magic_link_events"
  ON magic_link_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anonymous access for public token validation (limited to specific columns via API)
CREATE POLICY "Anon can view magic_links by token"
  ON magic_links FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update magic_links (for submissions)"
  ON magic_links FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anon can insert magic_link_events"
  ON magic_link_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE magic_links IS 'Secure tokenized URLs for external stakeholder interaction';
COMMENT ON TABLE magic_link_events IS 'Immutable audit trail of magic link activity';
COMMENT ON COLUMN magic_links.token_hash IS 'SHA-256 hash of the token - raw token is shown only once at creation';
COMMENT ON COLUMN magic_links.submission_data IS 'JSON data submitted by external party';
COMMENT ON FUNCTION expire_overdue_magic_links() IS 'Call periodically to expire overdue links';
COMMENT ON FUNCTION get_magic_links_needing_reminder(INT) IS 'Get links needing reminder emails N days before expiry';
