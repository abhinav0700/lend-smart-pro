import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const ReportsView = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports", dateRange],
    queryFn: async () => {
      const [loansResult, paymentsResult, customersResult] = await Promise.all([
        supabase
          .from("loans")
          .select(`*, customers:customer_id (name)`)
          .gte("start_date", dateRange.from)
          .lte("start_date", dateRange.to),
        supabase
          .from("payments")
          .select(`*, customers:customer_id (name), loans:loan_id (loan_type)`)
          .gte("payment_date", dateRange.from)
          .lte("payment_date", dateRange.to),
        supabase.from("customers").select("*", { count: "exact", head: true }),
      ]);

      const totalDisbursed = loansResult.data?.reduce(
        (sum, loan) => sum + Number(loan.principal_amount),
        0
      ) || 0;

      const totalCollected = paymentsResult.data?.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      ) || 0;

      return {
        loans: loansResult.data || [],
        payments: paymentsResult.data || [],
        totalCustomers: customersResult.count || 0,
        totalDisbursed,
        totalCollected,
      };
    },
  });

  const exportToCSV = () => {
    if (!reportData) return;

    const csvContent = [
      ["Date", "Customer", "Type", "Amount", "Payment Type", "Notes"],
      ...reportData.payments.map((p) => [
        format(new Date(p.payment_date), "yyyy-MM-dd"),
        p.customers?.name || "",
        p.payment_type,
        p.amount.toString(),
        p.loans?.loan_type || "",
        p.notes || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading report...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h2>
          <p className="text-muted-foreground">Detailed business insights</p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disbursed</p>
                <p className="text-2xl font-bold">₹{reportData?.totalDisbursed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <FileText className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold">₹{reportData?.totalCollected.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Loans</p>
                <p className="text-2xl font-bold">{reportData?.loans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData && reportData.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loan Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{payment.customers?.name}</TableCell>
                    <TableCell className="font-bold text-success">
                      ₹{Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.payment_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.loans?.loan_type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No payments in selected date range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
