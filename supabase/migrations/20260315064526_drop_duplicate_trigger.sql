-- Drop the duplicate trigger that was double-counting carry forward amounts
DROP TRIGGER IF EXISTS update_loan_balance_trigger ON public.payments;
