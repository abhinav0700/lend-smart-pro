-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  address TEXT,
  id_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create enum for loan types
CREATE TYPE public.loan_type AS ENUM ('fixed_interest', 'emi');

-- Create enum for loan status
CREATE TYPE public.loan_status AS ENUM ('active', 'completed', 'overdue');

-- Create loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  loan_type public.loan_type NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  
  -- Fixed interest loan fields
  interest_rate DECIMAL(5, 2),
  total_interest DECIMAL(15, 2),
  
  -- EMI loan fields
  emi_amount DECIMAL(15, 2),
  tenure_months INTEGER,
  remaining_tenure INTEGER,
  
  start_date DATE NOT NULL,
  status public.loan_status DEFAULT 'active',
  
  total_collected DECIMAL(15, 2) DEFAULT 0,
  remaining_balance DECIMAL(15, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create enum for payment type
CREATE TYPE public.payment_type AS ENUM ('cash', 'online', 'cheque');

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type public.payment_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now - can be restricted with auth later)
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on loans" ON public.loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate fixed interest
CREATE OR REPLACE FUNCTION public.calculate_fixed_interest(
  principal DECIMAL,
  rate DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (principal * rate) / 100;
END;
$$ LANGUAGE plpgsql;

-- Function to update loan balance
CREATE OR REPLACE FUNCTION public.update_loan_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update loan balance after payment
CREATE TRIGGER update_loan_after_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_loan_balance();