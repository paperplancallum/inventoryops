-- Migration: Add amazon_connection_ids to brands table
-- Part of Settings section implementation
-- Tracks which Amazon Seller Central accounts sell each brand

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS amazon_connection_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN brands.amazon_connection_ids IS 'Array of amazon_connections IDs that sell this brand';
