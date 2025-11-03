import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCards } from "./StatsCards";
import { RecentActivity } from "./RecentActivity";
import { CollectionChart } from "./CollectionChart";

export const DashboardView = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [customersResult, loansResult, paymentsResult] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("loans").select("*"),
        supabase.from("payments").select("*"),
      ]);

      const activeLoans = loansResult.data?.filter(l => l.status === "active") || [];
      const totalCollected = paymentsResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingDues = loansResult.data?.reduce((sum, l) => sum + Number(l.remaining_balance || 0), 0) || 0;

      return {
        totalCustomers: customersResult.count || 0,
        activeLoans: activeLoans.length,
        totalCollected,
        pendingDues,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your lending business</p>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollectionChart />
        <RecentActivity />
      </div>
    </div>
  );
};
