-- Add next_due_date column to loans table
ALTER TABLE public.loans ADD COLUMN next_due_date DATE;

-- Create function to calculate next due date for EMI loans
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  loan_start_date DATE,
  payments_count INTEGER
)
RETURNS DATE AS $$
BEGIN
  RETURN loan_start_date + (payments_count || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Update existing loans with next_due_date
UPDATE public.loans 
SET next_due_date = CASE 
  WHEN loan_type = 'emi' THEN 
    calculate_next_due_date(
      start_date, 
      CAST((SELECT COUNT(*) FROM public.payments WHERE loan_id = loans.id AND amount >= emi_amount) AS INTEGER)
    )
  ELSE NULL
END
WHERE status = 'active';

-- Create function to update next due date after payment
CREATE OR REPLACE FUNCTION public.update_next_due_date()
RETURNS TRIGGER AS $$
DECLARE
  loan_record RECORD;
  payment_count INTEGER;
BEGIN
  -- Get the loan details
  SELECT * INTO loan_record FROM public.loans WHERE id = NEW.loan_id;
  
  IF loan_record.loan_type = 'emi' AND loan_record.status = 'active' THEN
    -- Count EMI payments made
    SELECT CAST(COUNT(*) AS INTEGER) INTO payment_count 
    FROM public.payments 
    WHERE loan_id = NEW.loan_id AND amount >= loan_record.emi_amount;
    
    -- Update next due date
    UPDATE public.loans 
    SET next_due_date = calculate_next_due_date(loan_record.start_date, payment_count)
    WHERE id = NEW.loan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next due date after payment
CREATE TRIGGER update_next_due_date_after_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_next_due_date();