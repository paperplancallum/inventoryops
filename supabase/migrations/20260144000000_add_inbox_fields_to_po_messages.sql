-- Add inbox tracking fields to po_messages
-- These fields support the unified inbox feature

-- Add is_read column (defaults to false for new messages)
ALTER TABLE po_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_cleared column (allows hiding messages from inbox without deleting)
ALTER TABLE po_messages ADD COLUMN is_cleared BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient inbox queries (unread, non-cleared messages first)
CREATE INDEX idx_po_messages_inbox ON po_messages (is_read, is_cleared, created_at DESC);

-- Mark all existing messages as read (since they existed before inbox)
UPDATE po_messages SET is_read = TRUE;
