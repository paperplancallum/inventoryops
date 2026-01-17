-- Make supplier contact_email required and add new PO statuses for invoice workflow

-- 1. Make contact_email required on suppliers table
-- First, update any NULL emails to a placeholder (should be fixed manually)
UPDATE suppliers SET contact_email = 'update-required@placeholder.com' WHERE contact_email IS NULL;

-- Now make the column NOT NULL
ALTER TABLE suppliers ALTER COLUMN contact_email SET NOT NULL;

-- 2. Add new PO statuses for invoice workflow
-- Add 'awaiting_invoice' status (after sending magic link to supplier)
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'awaiting_invoice' AFTER 'sent';

-- Add 'invoice_received' status (after supplier submits via magic link)
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'invoice_received' AFTER 'awaiting_invoice';

-- 3. Add sent_to_supplier_at timestamp to track when magic link was sent
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_to_supplier_at TIMESTAMPTZ;

-- 4. Add invoice_received_at timestamp to track when supplier submitted
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_received_at TIMESTAMPTZ;

-- Note: Index on awaiting_invoice status can be added in a separate migration
-- after the enum value has been committed
