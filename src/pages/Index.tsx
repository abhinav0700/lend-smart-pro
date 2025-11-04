import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CustomersView } from "@/components/customers/CustomersView";
import { LoansView } from "@/components/loans/LoansView";
import { ReportsView } from "@/components/reports/ReportsView";
import { Header } from "@/components/layout/Header";
import { DuePaymentAlert } from "@/components/notifications/DuePaymentAlert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DuePaymentAlert />
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardView />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomersView />
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            <LoansView />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
