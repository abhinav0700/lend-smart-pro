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

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_type: z.enum(["cash", "online", "cheque"]),
  notes: z.string().optional(),
});

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  loan: any;
}

export const PaymentDialog = ({ open, onClose, loan }: PaymentDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_type: "cash",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!loan) return;

    try {
      const { error } = await supabase.from("payments").insert([
        {
          loan_id: loan.id,
          customer_id: loan.customer_id,
          amount: parseFloat(values.amount),
          payment_date: values.payment_date,
          payment_type: values.payment_type,
          notes: values.notes,
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
          <div className="bg-muted p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{loan.customers?.name}</p>
            <p className="text-sm text-muted-foreground mt-2">Remaining Balance</p>
            <p className="text-lg font-bold text-warning">
              ₹{Number(loan.remaining_balance || 0).toLocaleString()}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Enter amount" {...field} />
                  </FormControl>
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
                  <FormLabel>Payment Type</FormLabel>
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
      </DialogContent>
    </Dialog>
  );
};
