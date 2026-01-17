-- Auto-generate sequential payment references like PAY-2026-0001

-- Create sequence for payment numbers (resets yearly based on format)
CREATE SEQUENCE IF NOT EXISTS payment_number_seq START 1;

-- Function to generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get next sequence value
  v_seq := NEXTVAL('payment_number_seq');

  -- Generate reference: PAY-YYYY-NNNN
  NEW.reference := 'PAY-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reference on insert
DROP TRIGGER IF EXISTS auto_payment_reference ON invoice_payments;
CREATE TRIGGER auto_payment_reference
  BEFORE INSERT ON invoice_payments
  FOR EACH ROW
  WHEN (NEW.reference IS NULL OR NEW.reference = '')
  EXECUTE FUNCTION generate_payment_reference();

-- Backfill existing payments that don't have proper references
DO $$
DECLARE
  v_payment RECORD;
  v_year TEXT;
  v_seq INT;
BEGIN
  FOR v_payment IN
    SELECT id FROM invoice_payments
    WHERE reference IS NULL OR reference = '' OR reference NOT LIKE 'PAY-%'
    ORDER BY date, created_at
  LOOP
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    v_seq := NEXTVAL('payment_number_seq');

    UPDATE invoice_payments
    SET reference = 'PAY-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0')
    WHERE id = v_payment.id;
  END LOOP;
END $$;
