
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
  total_interest_paid numeric;
  new_remaining numeric;
  emi_payments_count integer;
  partial_carry numeric;
  interest_payment_count integer;
BEGIN
  SELECT * INTO loan_record FROM public.loans WHERE id = NEW.loan_id;
  
  IF loan_record.loan_type = 'fixed_interest' THEN
    SELECT COALESCE(SUM(amount), 0) INTO total_principal_paid
    FROM public.payments
    WHERE loan_id = NEW.loan_id AND payment_category = 'principal';
    
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM public.payments
    WHERE loan_id = NEW.loan_id;

    SELECT COALESCE(SUM(amount), 0) INTO total_interest_paid
    FROM public.payments
    WHERE loan_id = NEW.loan_id AND payment_category = 'interest';
    
    new_remaining = loan_record.principal_amount - total_principal_paid;
    IF new_remaining < 0 THEN new_remaining = 0; END IF;
    
    SELECT COUNT(*) INTO interest_payment_count
    FROM public.payments
    WHERE loan_id = NEW.loan_id AND payment_category = 'interest';
    
    UPDATE public.loans
    SET
      total_collected = total_paid,
      remaining_balance = new_remaining,
      total_interest = total_interest_paid,
      next_due_date = loan_record.start_date + ((interest_payment_count) || ' months')::INTERVAL,
      status = CASE
        WHEN new_remaining <= 0 THEN 'completed'::loan_status
        WHEN loan_record.status = 'closed'::loan_status THEN 'closed'::loan_status
        ELSE loan_record.status
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
    WHERE loan_id = NEW.loan_id AND payment_category = 'full';
    
    UPDATE public.loans
    SET
      total_collected = total_paid,
      remaining_balance = new_remaining,
      carry_forward_amount = partial_carry,
      remaining_tenure = GREATEST(loan_record.tenure_months - emi_payments_count, 0),
      next_due_date = loan_record.start_date + ((emi_payments_count) || ' months')::INTERVAL,
      status = CASE
        WHEN new_remaining <= 0 THEN 'completed'::loan_status
        WHEN loan_record.status = 'closed'::loan_status THEN 'closed'::loan_status
        ELSE loan_record.status
      END
    WHERE id = NEW.loan_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_payment_update_balance ON public.payments;
CREATE TRIGGER on_payment_update_balance
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loan_balance();

DROP TRIGGER IF EXISTS on_payment_update_due_date ON public.payments;
