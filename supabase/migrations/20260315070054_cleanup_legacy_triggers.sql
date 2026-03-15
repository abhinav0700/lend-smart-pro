-- Drop legacy triggers from 2025 migrations that execute redundant calculations for carry forward and next due date
DROP TRIGGER IF EXISTS update_loan_after_payment ON public.payments;
DROP TRIGGER IF EXISTS update_next_due_date_after_payment ON public.payments;
DROP TRIGGER IF EXISTS update_next_due_date_trigger ON public.payments;
