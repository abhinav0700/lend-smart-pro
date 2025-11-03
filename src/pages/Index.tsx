import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { CustomersView } from "@/components/customers/CustomersView";
import { LoansView } from "@/components/loans/LoansView";
import { Header } from "@/components/layout/Header";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
