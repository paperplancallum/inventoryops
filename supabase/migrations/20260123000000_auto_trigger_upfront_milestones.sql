-- Auto-trigger 'upfront' milestones when created or updated
-- This ensures that when a milestone's trigger is set to 'upfront', it's immediately marked as 'triggered'

-- Function to auto-trigger upfront milestones
CREATE OR REPLACE FUNCTION handle_upfront_milestone_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- If trigger is 'upfront' and status is still 'pending', mark as triggered
  IF NEW.trigger = 'upfront' AND NEW.trigger_status = 'pending' THEN
    NEW.trigger_status := 'triggered';
    NEW.trigger_date := NOW();
    -- Set due date if not already set
    IF NEW.due_date IS NULL THEN
      NEW.due_date := CURRENT_DATE + COALESCE(NEW.offset_days, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_upfront_milestones ON invoice_payment_schedule_items;
CREATE TRIGGER trigger_upfront_milestones
  BEFORE INSERT OR UPDATE ON invoice_payment_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_upfront_milestone_trigger();

-- Also fix any existing 'upfront' milestones that are still 'pending'
UPDATE invoice_payment_schedule_items
SET
  trigger_status = 'triggered',
  trigger_date = COALESCE(trigger_date, NOW()),
  due_date = COALESCE(due_date, CURRENT_DATE + COALESCE(offset_days, 0))
WHERE trigger = 'upfront' AND trigger_status = 'pending';
