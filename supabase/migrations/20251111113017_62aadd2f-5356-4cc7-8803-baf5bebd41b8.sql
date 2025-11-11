-- Add user_id to customers table
ALTER TABLE public.customers 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to loans table  
ALTER TABLE public.loans
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to payments table
ALTER TABLE public.payments
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update customers RLS policies
DROP POLICY IF EXISTS "Authenticated staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Loan officers and admins can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Loan officers and admins can update customers" ON public.customers;
DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;

CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
ON public.customers
FOR DELETE
USING (auth.uid() = user_id);

-- Update loans RLS policies
DROP POLICY IF EXISTS "Authenticated staff can view loans" ON public.loans;
DROP POLICY IF EXISTS "Loan officers and admins can create loans" ON public.loans;
DROP POLICY IF EXISTS "Loan officers and admins can update loans" ON public.loans;
DROP POLICY IF EXISTS "Only admins can delete loans" ON public.loans;

CREATE POLICY "Users can view their own loans"
ON public.loans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans"
ON public.loans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans"
ON public.loans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans"
ON public.loans
FOR DELETE
USING (auth.uid() = user_id);

-- Update payments RLS policies
DROP POLICY IF EXISTS "Authenticated staff can view payments" ON public.payments;
DROP POLICY IF EXISTS "Loan officers and admins can record payments" ON public.payments;
DROP POLICY IF EXISTS "Loan officers and admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "Only admins can delete payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
ON public.payments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
ON public.payments
FOR DELETE
USING (auth.uid() = user_id);