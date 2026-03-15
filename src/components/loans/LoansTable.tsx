import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, DollarSign, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { PaymentDialog } from "./PaymentDialog";
import { LoanDetailsDialog } from "./LoanDetailsDialog";
import { CloseLoanDialog } from "./CloseLoanDialog";

interface LoansTableProps {
  loans: any[];
  onEdit: (loan: any) => void;
  onRefetch: () => void;
}

export const LoansTable = ({ loans, onEdit, onRefetch }: LoansTableProps) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [closeLoanDialogOpen, setCloseLoanDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

  const handlePayment = (loan: any) => {
    setSelectedLoan(loan);
    setPaymentDialogOpen(true);
  };

  const handleViewDetails = (loan: any) => {
    setSelectedLoan(loan);
    setDetailsDialogOpen(true);
  };

  const handleCloseLoan = (loan: any) => {
    setSelectedLoan(loan);
    setCloseLoanDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary";
      case "completed":
      case "closed":
        return "bg-muted text-muted-foreground";
      case "overdue":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loans.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No loans found.</p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.map((loan) => {
              const isClosed = loan.status === "closed" || loan.status === "completed";
              return (
                <TableRow key={loan.id} className={isClosed ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{loan.customers?.name}</p>
                      <p className="text-sm text-muted-foreground">{loan.customers?.contact_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {loan.loan_type === "fixed_interest" ? "Fixed Interest" : "EMI"}
                    </Badge>
                    {loan.next_due_date && !isClosed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(loan.next_due_date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>₹{Number(loan.loan_type === 'fixed_interest' ? (loan.remaining_balance || loan.principal_amount) : loan.principal_amount).toLocaleString()}</TableCell>
                  <TableCell className="text-success font-medium">
                    ₹{Number(loan.total_collected || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-warning font-medium">
                    ₹{Number(loan.remaining_balance || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{format(new Date(loan.start_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(loan.status)}>
                      {loan.status === 'completed' ? 'closed' : loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(loan)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isClosed && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handlePayment(loan)}>
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onEdit(loan)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseLoan(loan)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          onRefetch();
        }}
        loan={selectedLoan}
      />

      <LoanDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        loan={selectedLoan}
      />

      <CloseLoanDialog
        open={closeLoanDialogOpen}
        onClose={() => {
          setCloseLoanDialogOpen(false);
          onRefetch();
        }}
        loan={selectedLoan}
      />
    </>
  );
};
