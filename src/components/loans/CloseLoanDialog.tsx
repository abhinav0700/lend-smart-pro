import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface CloseLoanDialogProps {
  open: boolean;
  onClose: () => void;
  loan: any;
}

export const CloseLoanDialog = ({ open, onClose, loan }: CloseLoanDialogProps) => {
  const [paymentType, setPaymentType] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  if (!loan) return null;

  const remainingBalance = Number(loan.remaining_balance || 0);

  const handleCloseLoan = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Record final payment if there's remaining balance
      if (remainingBalance > 0) {
        const { error: paymentError } = await supabase.from("payments").insert([{
          loan_id: loan.id,
          customer_id: loan.customer_id,
          amount: remainingBalance,
          payment_date: paymentDate,
          payment_type: paymentType as "cash" | "online" | "cheque",
          payment_category: "closure",
          notes: "Loan closure - final settlement",
          user_id: user.id,
        }]);

        if (paymentError) throw paymentError;
      }

      // Mark loan as closed
      const { error: loanError } = await supabase
        .from("loans")
        .update({
          status: "closed" as any,
          remaining_balance: 0,
          carry_forward_amount: 0,
        })
        .eq("id", loan.id);

      if (loanError) throw loanError;

      toast.success("Loan closed successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to close loan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Close Loan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{loan.customers?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining Balance to Settle</p>
              <p className="text-2xl font-bold text-warning">
                ₹{remainingBalance.toLocaleString()}
              </p>
            </div>
          </div>

          {remainingBalance > 0 && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Settlement Amount</label>
                <Input
                  type="number"
                  value={remainingBalance}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Date</label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <p className="text-sm text-destructive">
              Once closed, this loan will not accept any further payments. This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseLoan}
              disabled={loading}
            >
              {loading ? "Closing..." : "Confirm & Close Loan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
