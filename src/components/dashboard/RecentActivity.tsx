import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const RecentActivity = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["recent-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          customers:customer_id (name),
          loans:loan_id (loan_type)
        `)
        .order("payment_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments && payments.length > 0 ? (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {payment.customers?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-success">₹{Number(payment.amount).toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs">
                    {payment.payment_type}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No recent payments</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
