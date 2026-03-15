import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  loan_type: z.enum(["fixed_interest", "emi"]),
  principal_amount: z.string().min(1, "Principal amount is required"),
  interest_rate: z.string().optional(),
  emi_amount: z.string().optional(),
  tenure_months: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
});

interface LoanDialogProps {
  open: boolean;
  onClose: () => void;
  loan?: any;
}

export const LoanDialog = ({ open, onClose, loan }: LoanDialogProps) => {
  const [loanType, setLoanType] = useState<string>("fixed_interest");

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("name");
      return data || [];
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: "",
      loan_type: "fixed_interest",
      principal_amount: "",
      interest_rate: "",
      emi_amount: "",
      tenure_months: "",
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (loan) {
      form.reset({
        customer_id: loan.customer_id,
        loan_type: loan.loan_type,
        principal_amount: loan.principal_amount.toString(),
        interest_rate: loan.interest_rate?.toString() || "",
        emi_amount: loan.emi_amount?.toString() || "",
        tenure_months: loan.tenure_months?.toString() || "",
        start_date: loan.start_date,
      });
      setLoanType(loan.loan_type);
    } else {
      form.reset({
        customer_id: "",
        loan_type: "fixed_interest",
        principal_amount: "",
        interest_rate: "",
        emi_amount: "",
        tenure_months: "",
        start_date: new Date().toISOString().split("T")[0],
      });
      setLoanType("fixed_interest");
    }
  }, [loan, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const principal = parseFloat(values.principal_amount);
      let loanData: any = {
        customer_id: values.customer_id,
        loan_type: values.loan_type,
        principal_amount: principal,
        start_date: values.start_date,
        user_id: user.id,
      };

      if (values.loan_type === "fixed_interest") {
        const rate = parseFloat(values.interest_rate || "0");
        // Interest rate is per annum, monthly = (principal * rate) / (100 * 12)
        const monthlyInterest = (principal * rate) / (100 * 12);
        loanData.interest_rate = rate;
        loanData.total_interest = 0; // Will accumulate as interest payments are made
        loanData.remaining_balance = principal; // Only principal tracked as balance
        // Set first due date one month from start
        loanData.next_due_date = values.start_date;
      } else {
        const emi = parseFloat(values.emi_amount || "0");
        const tenure = parseInt(values.tenure_months || "0");
        loanData.emi_amount = emi;
        loanData.tenure_months = tenure;
        loanData.remaining_tenure = tenure;
        loanData.remaining_balance = emi * tenure;
      }

      if (loan) {
        const { error } = await supabase.from("loans").update(loanData).eq("id", loan.id);
        if (error) throw error;
        toast.success("Loan updated successfully");
      } else {
        const { error } = await supabase.from("loans").insert([loanData]);
        if (error) throw error;
        toast.success("Loan created successfully");
      }

      onClose();
    } catch (error) {
      toast.error("Failed to save loan");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Create New Loan"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loan_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setLoanType(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed_interest">Fixed Interest</SelectItem>
                      <SelectItem value="emi">EMI Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="principal_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loanType === "fixed_interest" && (
              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Enter rate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {loanType === "emi" && (
              <>
                <FormField
                  control={form.control}
                  name="emi_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMI Amount (Monthly)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter EMI amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenure_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenure (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter tenure" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{loan ? "Update" : "Create"} Loan</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
