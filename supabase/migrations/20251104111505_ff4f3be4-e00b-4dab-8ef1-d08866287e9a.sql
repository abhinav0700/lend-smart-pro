-- Create user_roles table for staff authorization
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'loan_officer', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for user_roles (only admins can manage roles)
CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on loans" ON public.loans;
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;

-- Create secure RLS policies for customers (authenticated staff only)
CREATE POLICY "Authenticated staff can view customers" 
ON public.customers FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles));

CREATE POLICY "Loan officers and admins can insert customers" 
ON public.customers FOR INSERT 
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer'))
  AND length(name) <= 200
  AND length(contact_number) BETWEEN 10 AND 15
);

CREATE POLICY "Loan officers and admins can update customers" 
ON public.customers FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')))
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer'))
  AND length(name) <= 200
  AND length(contact_number) BETWEEN 10 AND 15
);

CREATE POLICY "Only admins can delete customers" 
ON public.customers FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- Create secure RLS policies for loans (authenticated staff only)
CREATE POLICY "Authenticated staff can view loans" 
ON public.loans FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles));

CREATE POLICY "Loan officers and admins can create loans" 
ON public.loans FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')));

CREATE POLICY "Loan officers and admins can update loans" 
ON public.loans FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')));

CREATE POLICY "Only admins can delete loans" 
ON public.loans FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- Create secure RLS policies for payments (authenticated staff only)
CREATE POLICY "Authenticated staff can view payments" 
ON public.payments FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles));

CREATE POLICY "Loan officers and admins can record payments" 
ON public.payments FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')));

CREATE POLICY "Loan officers and admins can update payments" 
ON public.payments FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'loan_officer')));

CREATE POLICY "Only admins can delete payments" 
ON public.payments FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role = 'admin'));

-- Add database constraints for input validation
ALTER TABLE public.customers 
  ADD CONSTRAINT check_name_length CHECK (length(name) <= 200),
  ADD CONSTRAINT check_contact_length CHECK (length(contact_number) <= 50),
  ADD CONSTRAINT check_address_length CHECK (address IS NULL OR length(address) <= 500),
  ADD CONSTRAINT check_id_proof_length CHECK (id_proof IS NULL OR length(id_proof) <= 100);

-- Fix database functions to include search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_fixed_interest(principal numeric, rate numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (principal * rate) / 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_loan_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.loans 
  SET 
    total_collected = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.payments 
      WHERE loan_id = NEW.loan_id
    ),
    remaining_balance = CASE 
      WHEN loan_type = 'fixed_interest' THEN 
        (principal_amount + total_interest) - (
          SELECT COALESCE(SUM(amount), 0) 
          FROM public.payments 
          WHERE loan_id = NEW.loan_id
        )
      WHEN loan_type = 'emi' THEN 
        (emi_amount * tenure_months) - (
          SELECT COALESCE(SUM(amount), 0) 
          FROM public.payments 
          WHERE loan_id = NEW.loan_id
        )
    END,
    remaining_tenure = CASE 
      WHEN loan_type = 'emi' THEN 
        tenure_months - (
          SELECT COUNT(*) 
          FROM public.payments 
          WHERE loan_id = NEW.loan_id AND amount >= emi_amount
        )
      ELSE remaining_tenure
    END,
    status = CASE 
      WHEN (
        CASE 
          WHEN loan_type = 'fixed_interest' THEN 
            (principal_amount + total_interest) - (
              SELECT COALESCE(SUM(amount), 0) 
              FROM public.payments 
              WHERE loan_id = NEW.loan_id
            )
          WHEN loan_type = 'emi' THEN 
            (emi_amount * tenure_months) - (
              SELECT COALESCE(SUM(amount), 0) 
              FROM public.payments 
              WHERE loan_id = NEW.loan_id
            )
        END
      ) <= 0 THEN 'completed'::loan_status
      ELSE status
    END
  WHERE id = NEW.loan_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_next_due_date(loan_start_date date, payments_count integer)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN loan_start_date + (payments_count || ' months')::INTERVAL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_next_due_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  loan_record RECORD;
  payment_count INTEGER;
BEGIN
  SELECT * INTO loan_record FROM public.loans WHERE id = NEW.loan_id;
  
  IF loan_record.loan_type = 'emi' AND loan_record.status = 'active' THEN
    SELECT CAST(COUNT(*) AS INTEGER) INTO payment_count 
    FROM public.payments 
    WHERE loan_id = NEW.loan_id AND amount >= loan_record.emi_amount;
    
    UPDATE public.loans 
    SET next_due_date = calculate_next_due_date(loan_record.start_date, payment_count)
    WHERE id = NEW.loan_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add triggers for update_updated_at_column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
    CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_loans_updated_at') THEN
    CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;