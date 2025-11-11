import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, AlertCircle } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalCustomers: number;
    activeLoans: number;
    overdueLoans: number;
    totalCollected: number;
    pendingDues: number;
    totalOutstanding: number;
  };
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Active Loans",
      value: stats?.activeLoans || 0,
      subtitle: stats?.overdueLoans ? `${stats.overdueLoans} overdue` : undefined,
      icon: TrendingUp,
      bgColor: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      title: "Total Collected",
      value: `₹${(stats?.totalCollected || 0).toLocaleString()}`,
      icon: DollarSign,
      bgColor: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Outstanding Amount",
      value: `₹${(stats?.totalOutstanding || 0).toLocaleString()}`,
      subtitle: `₹${(stats?.pendingDues || 0).toLocaleString()} pending`,
      icon: AlertCircle,
      bgColor: "bg-warning/10",
      iconColor: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-border hover:shadow-elegant transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  {"subtitle" in card && card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor} transition-all duration-300`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
