-- Migration: Add Transfer Invoice Integration
-- Creates automatic invoice when transfer status changes to 'booked'
-- Uses shipping agent's payment terms template for due date calculation

-- =============================================================================
-- ADD 'transfer' TO linked_entity_type ENUM
-- =============================================================================

ALTER TYPE linked_entity_type ADD VALUE IF NOT EXISTS 'transfer';

-- =============================================================================
-- FUNCTION: Create invoice when transfer is booked
-- =============================================================================

CREATE OR REPLACE FUNCTION create_invoice_for_transfer_booked()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_total_shipping_cost DECIMAL(12,2);
  v_shipping_agent_name TEXT;
  v_template_id UUID;
  v_milestones JSONB;
  v_milestone JSONB;
  v_sort INT := 0;
BEGIN
  -- Only create invoice when transitioning from 'draft' to 'booked'
  IF OLD.status = 'draft' AND NEW.status = 'booked' THEN
    -- Calculate total shipping costs
    v_total_shipping_cost := COALESCE(NEW.cost_freight, 0) +
                             COALESCE(NEW.cost_insurance, 0) +
                             COALESCE(NEW.cost_duties, 0) +
                             COALESCE(NEW.cost_taxes, 0) +
                             COALESCE(NEW.cost_handling, 0) +
                             COALESCE(NEW.cost_other, 0);

    -- Skip if no shipping costs
    IF v_total_shipping_cost <= 0 THEN
      RETURN NEW;
    END IF;

    -- Get shipping agent name and payment terms template if exists
    IF NEW.shipping_agent_id IS NOT NULL THEN
      SELECT sa.name, sa.payment_terms_template_id
      INTO v_shipping_agent_name, v_template_id
      FROM shipping_agents sa
      WHERE sa.id = NEW.shipping_agent_id;
    END IF;

    -- Get template milestones if exists
    IF v_template_id IS NOT NULL THEN
      SELECT milestones INTO v_milestones
      FROM payment_terms_templates
      WHERE id = v_template_id;
    END IF;

    -- Create invoice
    INSERT INTO invoices (
      description,
      type,
      linked_entity_type,
      linked_entity_id,
      linked_entity_name,
      amount,
      creation_method,
      payment_terms_template_id
    ) VALUES (
      'Shipping costs - ' || NEW.transfer_number,
      'shipping',
      'transfer',
      NEW.id,
      NEW.transfer_number || COALESCE(' - ' || v_shipping_agent_name, ''),
      v_total_shipping_cost,
      'automatic',
      v_template_id
    ) RETURNING id INTO v_invoice_id;

    -- Create payment schedule items from template if exists
    IF v_milestones IS NOT NULL AND jsonb_array_length(v_milestones) > 0 THEN
      FOR v_milestone IN SELECT * FROM jsonb_array_elements(v_milestones)
      LOOP
        v_sort := v_sort + 1;
        INSERT INTO invoice_payment_schedule_items (
          invoice_id,
          milestone_name,
          percentage,
          amount,
          trigger,
          offset_days,
          sort_order,
          trigger_status,
          trigger_date,
          due_date
        ) VALUES (
          v_invoice_id,
          v_milestone->>'name',
          (v_milestone->>'percentage')::DECIMAL,
          v_total_shipping_cost * (v_milestone->>'percentage')::DECIMAL / 100,
          (v_milestone->>'trigger')::payment_milestone_trigger,
          COALESCE((v_milestone->>'offsetDays')::INT, 0),
          v_sort,
          -- Mark manual/upfront as triggered immediately
          CASE WHEN v_milestone->>'trigger' IN ('upfront', 'manual') THEN 'triggered' ELSE 'pending' END,
          CASE WHEN v_milestone->>'trigger' IN ('upfront', 'manual') THEN NOW() ELSE NULL END,
          CASE WHEN v_milestone->>'trigger' IN ('upfront', 'manual') THEN CURRENT_DATE + COALESCE((v_milestone->>'offsetDays')::INT, 0) ELSE NULL END
        );
      END LOOP;
    ELSE
      -- No template, create single 100% manual milestone
      INSERT INTO invoice_payment_schedule_items (
        invoice_id,
        milestone_name,
        percentage,
        amount,
        trigger,
        trigger_status,
        sort_order
      ) VALUES (
        v_invoice_id,
        'Full Payment',
        100,
        v_total_shipping_cost,
        'manual',
        'pending',
        1
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Create invoice on transfer status change to booked
-- =============================================================================

DROP TRIGGER IF EXISTS transfer_booked_create_invoice_trigger ON transfers;

CREATE TRIGGER transfer_booked_create_invoice_trigger
  AFTER UPDATE OF status ON transfers
  FOR EACH ROW
  EXECUTE FUNCTION create_invoice_for_transfer_booked();

-- =============================================================================
-- FUNCTION: Update invoice amount when transfer costs change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_invoice_for_transfer_cost_change()
RETURNS TRIGGER AS $$
DECLARE
  v_new_total DECIMAL(12,2);
  v_old_total DECIMAL(12,2);
BEGIN
  -- Calculate totals
  v_new_total := COALESCE(NEW.cost_freight, 0) +
                 COALESCE(NEW.cost_insurance, 0) +
                 COALESCE(NEW.cost_duties, 0) +
                 COALESCE(NEW.cost_taxes, 0) +
                 COALESCE(NEW.cost_handling, 0) +
                 COALESCE(NEW.cost_other, 0);

  v_old_total := COALESCE(OLD.cost_freight, 0) +
                 COALESCE(OLD.cost_insurance, 0) +
                 COALESCE(OLD.cost_duties, 0) +
                 COALESCE(OLD.cost_taxes, 0) +
                 COALESCE(OLD.cost_handling, 0) +
                 COALESCE(OLD.cost_other, 0);

  -- Only update if costs changed
  IF v_old_total IS DISTINCT FROM v_new_total THEN
    UPDATE invoices
    SET
      amount = v_new_total,
      updated_at = NOW()
    WHERE linked_entity_type = 'transfer'
      AND linked_entity_id = NEW.id;

    -- Update schedule item amounts proportionally
    UPDATE invoice_payment_schedule_items psi
    SET amount = v_new_total * psi.percentage / 100
    FROM invoices i
    WHERE psi.invoice_id = i.id
      AND i.linked_entity_type = 'transfer'
      AND i.linked_entity_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Update invoice when transfer costs change
-- =============================================================================

DROP TRIGGER IF EXISTS transfer_update_invoice_trigger ON transfers;

CREATE TRIGGER transfer_update_invoice_trigger
  AFTER UPDATE ON transfers
  FOR EACH ROW
  WHEN (OLD.status != 'draft') -- Only update invoices for non-draft transfers
  EXECUTE FUNCTION update_invoice_for_transfer_cost_change();
