-- =============================================================================
-- Migration: Create Generated Documents System
-- =============================================================================

-- Document type enum
CREATE TYPE generated_document_type AS ENUM (
  'purchase-order-pdf',
  'inspection-brief',
  'shipping-manifest',
  'packing-list'
);

-- Source entity type enum
CREATE TYPE document_source_type AS ENUM (
  'purchase-order',
  'inspection',
  'transfer'
);

-- Main table for all generated documents
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source entity reference
  source_entity_type document_source_type NOT NULL,
  source_entity_id UUID NOT NULL,
  source_entity_ref TEXT NOT NULL, -- e.g., "PO-2026-0001", "INS-26-0001", "TRF-001"

  -- Document type and name
  document_type generated_document_type NOT NULL,
  document_name TEXT NOT NULL, -- Human-readable name, e.g., "PO-2026-0001.pdf"

  -- Storage
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT NOT NULL DEFAULT 0,

  -- Snapshot of source data at generation time (for historical accuracy)
  data_snapshot JSONB NOT NULL DEFAULT '{}',

  -- Generation metadata
  generated_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_by_name TEXT,
  generation_trigger TEXT CHECK (generation_trigger IN ('auto', 'manual')),
  notes TEXT,

  -- Brand association (for multi-tenant filtering)
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_generated_docs_source ON generated_documents(source_entity_type, source_entity_id);
CREATE INDEX idx_generated_docs_type ON generated_documents(document_type);
CREATE INDEX idx_generated_docs_brand ON generated_documents(brand_id);
CREATE INDEX idx_generated_docs_created ON generated_documents(created_at DESC);
CREATE INDEX idx_generated_docs_search ON generated_documents(source_entity_ref);

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- NOTE: These policies are permissive for initial development.
-- For production with multi-tenant requirements, add brand-based filtering:
-- USING (brand_id IN (SELECT brand_id FROM user_brands WHERE user_id = auth.uid()))

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view documents
-- TODO: For multi-tenant, filter by brand membership
CREATE POLICY "Authenticated users can view generated_documents"
  ON generated_documents FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert documents
CREATE POLICY "Authenticated users can insert generated_documents"
  ON generated_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete documents they created, or any document if they're admin
-- For now, allow any authenticated user to delete (single-tenant)
-- TODO: For production, restrict to creator or admin role
CREATE POLICY "Authenticated users can delete generated_documents"
  ON generated_documents FOR DELETE
  TO authenticated
  USING (
    generated_by_id = auth.uid()
    OR true  -- Remove this line when implementing proper role-based access
  );

-- =============================================================================
-- Storage Bucket
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for authenticated users
CREATE POLICY "Authenticated upload generated docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-documents');

CREATE POLICY "Authenticated view generated docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'generated-documents');

CREATE POLICY "Authenticated delete generated docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'generated-documents');

-- =============================================================================
-- Summary Function for Dashboard
-- =============================================================================
-- Using a function instead of a raw view allows for future optimization
-- such as caching, materialized views, or pre-computed counters.
-- For small-medium datasets (< 100K rows), this performs well.
-- For larger datasets, consider:
-- 1. Materialized view with periodic refresh
-- 2. Pre-computed counters updated via triggers
-- 3. Caching at the application layer

CREATE OR REPLACE FUNCTION get_documents_summary()
RETURNS TABLE (
  total int,
  purchase_orders int,
  inspections int,
  transfers int,
  this_month int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE document_type = 'purchase-order-pdf')::int AS purchase_orders,
    COUNT(*) FILTER (WHERE document_type = 'inspection-brief')::int AS inspections,
    COUNT(*) FILTER (WHERE document_type IN ('shipping-manifest', 'packing-list'))::int AS transfers,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))::int AS this_month
  FROM generated_documents;
$$;

-- Keep the view for backward compatibility, but it now calls the function
CREATE OR REPLACE VIEW generated_documents_summary AS
SELECT * FROM get_documents_summary();

GRANT SELECT ON generated_documents_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_documents_summary() TO authenticated;

-- Note: A partial index for "this_month" queries would be ideal but PostgreSQL
-- requires IMMUTABLE expressions in index predicates. The existing idx_generated_docs_created
-- index on created_at DESC will be used for date-range queries instead.

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE generated_documents IS 'Stores metadata for all generated PDF documents across the system';
COMMENT ON COLUMN generated_documents.data_snapshot IS 'JSON snapshot of source entity data at PDF generation time for historical accuracy';
COMMENT ON COLUMN generated_documents.generation_trigger IS 'Whether document was auto-generated on status change or manually generated by user';
