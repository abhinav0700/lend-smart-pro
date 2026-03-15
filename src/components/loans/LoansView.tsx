import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoansTable } from "./LoansTable";
import { LoanDialog } from "./LoanDialog";
import { ExportButton } from "@/components/reports/ExportButton";

export const LoansView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: loans, isLoading, refetch } = useQuery({
    queryKey: ["loans", statusFilter],
    queryFn: async () => {
      // Check overdue status on each fetch
      await supabase.rpc("check_overdue_loans" as any);

      let query = supabase
        .from("loans")
        .select(`
          *,
          customers:customer_id (name, contact_number)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (loan: any) => {
    setSelectedLoan(loan);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedLoan(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Loans</h2>
          <p className="text-muted-foreground">Manage all loan accounts</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={loans || []} filename={`loans_${statusFilter}`} type="loans" />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Loan
          </Button>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All Loans</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading loans...</div>
          ) : (
            <LoansTable loans={loans || []} onEdit={handleEdit} onRefetch={refetch} />
          )}
        </TabsContent>
      </Tabs>

      <LoanDialog open={dialogOpen} onClose={handleClose} loan={selectedLoan} />
    </div>
  );
};
