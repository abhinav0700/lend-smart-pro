import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const CollectionChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["collection-chart"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const { data } = await supabase
          .from("payments")
          .select("amount")
          .gte("payment_date", format(start, "yyyy-MM-dd"))
          .lte("payment_date", format(end, "yyyy-MM-dd"));

        const total = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        months.push({
          month: format(date, "MMM"),
          amount: total,
        });
      }

      return months;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
