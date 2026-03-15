import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_type: z.enum(["cash", "online", "cheque"]),
  payment_category: z.string().min(1, "Payment category is required"),
  notes: z.string().optional(),
});

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  loan: any;
}

export const PaymentDialog = ({ open, onClose, loan }: PaymentDialogProps) => {
  const isFixedInterest = loan?.loan_type === "fixed_interest";
  const isEMI = loan?.loan_type === "emi";
  const isClosed = loan?.status === "closed" || loan?.status === "completed";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_type: "cash",
      payment_category: isFixedInterest ? "interest" : "full",
      notes: "",
    },
  });

  const paymentCategory = form.watch("payment_category");

  // Auto-fill amount based on category selection
  useEffect(() => {
    if (!loan) return;

    if (isFixedInterest && paymentCategory === "interest") {
      const interestAmount = (Number(loan.principal_amount) * Number(loan.interest_rate || 0)) / 100;
      form.setValue("amount", interestAmount.toString());
    } else if (isFixedInterest && paymentCategory === "principal") {
      form.setValue("amount", "");
    } else if (isEMI && paymentCategory === "full") {
      const emiWithCarry = Number(loan.emi_amount || 0) + Number(loan.carry_forward_amount || 0);
      form.setValue("amount", emiWithCarry.toString());
    } else if (isEMI && paymentCategory === "partial") {
      form.setValue("amount", "");
    }
  }, [paymentCategory, loan, isFixedInterest, isEMI, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && loan) {
      const defaultCategory = isFixedInterest ? "interest" : "full";
      form.reset({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_type: "cash",
        payment_category: defaultCategory,
        notes: "",
      });
    }
  }, [open, loan, isFixedInterest, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!loan) return;

    if (isClosed) {
      toast.error("This loan is closed. No further payments allowed.");
      return;
    }

    const amount = parseFloat(values.amount);

    // Validation for EMI partial payment
    if (isEMI && values.payment_category === "partial") {
      const maxAmount = Number(loan.emi_amount || 0) + Number(loan.carry_forward_amount || 0);
      if (amount >= maxAmount) {
        toast.error(`Partial payment must be less than ₹${maxAmount.toLocaleString()}`);
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("payments").insert([
        {
          loan_id: loan.id,
          customer_id: loan.customer_id,
          amount: amount,
          payment_date: values.payment_date,
          payment_type: values.payment_type,
          payment_category: values.payment_category,
          notes: values.notes,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Payment recorded successfully");
      form.reset();
      onClose();
    } catch (error) {
      toast.error("Failed to record payment");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {loan && (
          <div className="bg-muted p-4 rounded-lg mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{loan.customers?.name}</p>
              </div>
              <Badge variant="outline">
                {isFixedInterest ? "Fixed Interest" : "EMI"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Principal</p>
                <p className="font-bold">₹{Number(loan.principal_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className="text-lg font-bold text-warning">
                  ₹{Number(loan.remaining_balance || 0).toLocaleString()}
                </p>
              </div>
              {isEMI && Number(loan.carry_forward_amount || 0) > 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-destructive">Carry Forward from Previous</p>
                  <p className="font-bold text-destructive">
                    ₹{Number(loan.carry_forward_amount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {isClosed ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">This loan is closed. No further payments can be recorded.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Payment Category - different options based on loan type */}
              <FormField
                control={form.control}
                name="payment_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isFixedInterest ? "Payment For" : "Payment Mode"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isFixedInterest ? (
                          <>
                            <SelectItem value="interest">Interest Payment</SelectItem>
                            <SelectItem value="principal">Principal Payment</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="full">Full Payment</SelectItem>
                            <SelectItem value="partial">Partial Payment</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter amount"
                        {...field}
                        readOnly={
                          (isFixedInterest && paymentCategory === "interest") ||
                          (isEMI && paymentCategory === "full")
                        }
                        className={
                          (isFixedInterest && paymentCategory === "interest") ||
                          (isEMI && paymentCategory === "full")
                            ? "bg-muted cursor-not-allowed"
                            : ""
                        }
                      />
                    </FormControl>
                    {isEMI && paymentCategory === "full" && Number(loan?.carry_forward_amount || 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        EMI ₹{Number(loan.emi_amount).toLocaleString()} + Carry Forward ₹{Number(loan.carry_forward_amount).toLocaleString()}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
