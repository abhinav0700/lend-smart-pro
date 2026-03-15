
ALTER TYPE public.loan_status ADD VALUE IF NOT EXISTS 'closed';

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_category text DEFAULT 'regular';

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS carry_forward_amount numeric DEFAULT 0;

CREATE OR REPLACE FUNCTION public.check_overdue_loans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.loans
  SET status = 'overdue'::loan_status
  WHERE status = 'active'::loan_status
    AND loan_type = 'emi'
    AND next_due_date IS NOT NULL
    AND next_due_date < CURRENT_DATE;

  UPDATE public.loans
  SET status = 'overdue'::loan_status
  WHERE status = 'active'::loan_status
    AND loan_type = 'fixed_interest'
    AND id NOT IN (
      SELECT DISTINCT loan_id FROM public.payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
    )
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_loan_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  loan_record RECORD;
  total_paid numeric;
  total_principal_paid numeric;
  new_remaining numeric;
  emi_payments_count integer;
  partial_carry numeric;
BEGIN
  SELECT * INTO loan_record FROM public.loans WHERE id = NEW.loan_id;
  
  IF loan_record.loan_type = 'fixed_interest' THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_principal_paid
    FROM public.payments
    WHERE loan_id = NEW.loan_id AND payment_category = 'principal';
    
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM public.payments
    WHERE loan_id = NEW.loan_id;
    
    new_remaining = loan_record.principal_amount - total_principal_paid;
    IF new_remaining < 0 THEN new_remaining = 0; END IF;
    
    UPDATE public.loans
    SET
      total_collected = total_paid,
      remaining_balance = new_remaining,
      status = CASE
        WHEN new_remaining <= 0 THEN 'completed'::loan_status
        ELSE status
      END
    WHERE id = NEW.loan_id;
    
  ELSIF loan_record.loan_type = 'emi' THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM public.payments WHERE loan_id = NEW.loan_id;
    
    new_remaining = (loan_record.emi_amount * loan_record.tenure_months) - total_paid;
    IF new_remaining < 0 THEN new_remaining = 0; END IF;
    
    IF NEW.payment_category = 'partial' THEN
      partial_carry = loan_record.emi_amount - NEW.amount + COALESCE(loan_record.carry_forward_amount, 0);
      IF partial_carry < 0 THEN partial_carry = 0; END IF;
    ELSE
      partial_carry = 0;
    END IF;
    
    SELECT COUNT(*) INTO emi_payments_count
    FROM public.payments
    WHERE loan_id = NEW.loan_id AND amount >= loan_record.emi_amount;
    
    UPDATE public.loans
    SET
      total_collected = total_paid,
      remaining_balance = new_remaining,
      carry_forward_amount = partial_carry,
      remaining_tenure = loan_record.tenure_months - emi_payments_count,
      status = CASE
        WHEN new_remaining <= 0 THEN 'completed'::loan_status
        ELSE status
      END
    WHERE id = NEW.loan_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS update_loan_balance_trigger ON public.payments;
CREATE TRIGGER update_loan_balance_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loan_balance();

DROP TRIGGER IF EXISTS update_next_due_date_trigger ON public.payments;
CREATE TRIGGER update_next_due_date_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_next_due_date();
