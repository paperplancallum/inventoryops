-- Add inbox-related fields to shipping_agent_messages
-- The table already exists from 20260119001000_create_transfers.sql
-- This migration adds: is_cleared, transfer_id, and unread_count on shipping_agents

-- Add unread_count to shipping_agents table
ALTER TABLE shipping_agents ADD COLUMN IF NOT EXISTS unread_count INT NOT NULL DEFAULT 0;

-- Add is_cleared column for inbox functionality (hide messages without deleting)
ALTER TABLE shipping_agent_messages ADD COLUMN IF NOT EXISTS is_cleared BOOLEAN NOT NULL DEFAULT FALSE;

-- Add transfer_id to link messages to specific transfers (optional relationship)
ALTER TABLE shipping_agent_messages ADD COLUMN IF NOT EXISTS transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL;

-- Create index for efficient inbox queries
CREATE INDEX IF NOT EXISTS idx_shipping_agent_messages_inbox ON shipping_agent_messages(is_read, is_cleared, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_messages_transfer ON shipping_agent_messages(transfer_id);
