import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isToday, isPast, parseISO } from "date-fns";

export interface Notification {
  id: string;
  type: "due_today" | "overdue" | "upcoming";
  title: string;
  message: string;
  loanId: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  priority: "high" | "medium" | "low";
}

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: loans, error } = await supabase
        .from("loans")
        .select(`
          *,
          customers:customer_id (name, contact_number)
        `)
        .eq("status", "active")
        .not("next_due_date", "is", null);

      if (error) throw error;

      const notifications: Notification[] = [];

      loans?.forEach((loan) => {
        if (!loan.next_due_date) return;

        const dueDate = parseISO(loan.next_due_date);
        const amount = loan.loan_type === "emi" ? loan.emi_amount : loan.remaining_balance;

        if (isToday(dueDate)) {
          notifications.push({
            id: `due-${loan.id}`,
            type: "due_today",
            title: "Payment Due Today!",
            message: `${loan.customers?.name} - EMI payment of ₹${Number(amount).toLocaleString()} is due today`,
            loanId: loan.id,
            customerId: loan.customer_id,
            customerName: loan.customers?.name || "",
            amount: Number(amount),
            date: loan.next_due_date,
            priority: "high",
          });
        } else if (isPast(dueDate)) {
          notifications.push({
            id: `overdue-${loan.id}`,
            type: "overdue",
            title: "Payment Overdue!",
            message: `${loan.customers?.name} - Payment of ₹${Number(amount).toLocaleString()} is overdue`,
            loanId: loan.id,
            customerId: loan.customer_id,
            customerName: loan.customers?.name || "",
            amount: Number(amount),
            date: loan.next_due_date,
            priority: "high",
          });
        }
      });

      // Check for overdue fixed interest loans
      const { data: overdueLoans } = await supabase
        .from("loans")
        .select(`
          *,
          customers:customer_id (name, contact_number)
        `)
        .eq("status", "overdue");

      overdueLoans?.forEach((loan) => {
        if (loan.loan_type === "fixed_interest") {
          notifications.push({
            id: `overdue-fixed-${loan.id}`,
            type: "overdue",
            title: "Loan Overdue!",
            message: `${loan.customers?.name} - Outstanding balance ₹${Number(loan.remaining_balance).toLocaleString()}`,
            loanId: loan.id,
            customerId: loan.customer_id,
            customerName: loan.customers?.name || "",
            amount: Number(loan.remaining_balance),
            date: loan.start_date,
            priority: "high",
          });
        }
      });

      return notifications;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
