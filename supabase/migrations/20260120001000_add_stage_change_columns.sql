-- Add stage_from and stage_to columns for stage change logging

-- Add columns to batch_change_log
ALTER TABLE batch_change_log
ADD COLUMN IF NOT EXISTS stage_from TEXT,
ADD COLUMN IF NOT EXISTS stage_to TEXT;

-- Add index for stage change queries
CREATE INDEX IF NOT EXISTS idx_batch_change_log_change_type ON batch_change_log(change_type);
