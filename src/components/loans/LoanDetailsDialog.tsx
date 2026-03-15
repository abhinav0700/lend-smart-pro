import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LoanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  loan: any;
}

export const LoanDetailsDialog = ({ open, onClose, loan }: LoanDetailsDialogProps) => {
  const { data: payments } = useQuery({
    queryKey: ["loan-payments", loan?.id],
    queryFn: async () => {
      if (!loan) return [];
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("loan_id", loan.id)
        .order("payment_date", { ascending: false });
      return data || [];
    },
    enabled: !!loan,
  });

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{loan.customers?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{loan.customers?.contact_number}</p>
              </div>
            </CardContent>
          </Card>

          {/* Loan Info */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <Badge variant="outline">
                  {loan.loan_type === "fixed_interest" ? "Fixed Interest" : "EMI"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="font-bold">₹{Number(loan.principal_amount).toLocaleString()}</p>
              </div>
              {loan.loan_type === "fixed_interest" ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate (P.A.)</p>
                    <p className="font-medium">{loan.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Interest</p>
                    <p className="font-bold">₹{Math.round((Number(loan.remaining_balance || loan.principal_amount) * Number(loan.interest_rate || 0)) / (100 * 12)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interest Collected</p>
                    <p className="font-bold text-success">₹{Number(loan.total_interest || 0).toLocaleString()}</p>
                  </div>
                  {loan.next_due_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Due Date</p>
                      <p className="font-medium">{format(new Date(loan.next_due_date), "MMM dd, yyyy")}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">EMI Amount</p>
                    <p className="font-medium">₹{Number(loan.emi_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">{loan.tenure_months} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Tenure</p>
                    <p className="font-medium">{loan.remaining_tenure} months</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="font-bold text-success">
                  ₹{Number(loan.total_collected || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className="font-bold text-warning">
                  ₹{Number(loan.remaining_balance || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(new Date(loan.start_date), "MMM dd, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-bold text-success">
                          ₹{Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            payment.payment_category === 'interest' ? 'secondary' :
                            payment.payment_category === 'principal' ? 'default' :
                            payment.payment_category === 'partial' ? 'outline' : 'default'
                          }>
                            {payment.payment_category === 'interest' ? 'Interest' :
                             payment.payment_category === 'principal' ? 'Principal' :
                             payment.payment_category === 'full' ? 'Full EMI' :
                             payment.payment_category === 'partial' ? 'Partial EMI' :
                             payment.payment_category || 'Regular'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
