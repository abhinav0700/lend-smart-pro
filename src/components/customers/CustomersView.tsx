import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomersTable } from "./CustomersTable";
import { CustomerDialog } from "./CustomerDialog";
import { ExportButton } from "@/components/reports/ExportButton";

export const CustomersView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Customers</h2>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={customers || []} filename="customers" type="customers" />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading customers...</div>
      ) : (
        <CustomersTable customers={customers || []} onEdit={handleEdit} onRefetch={refetch} />
      )}

      <CustomerDialog
        open={dialogOpen}
        onClose={handleClose}
        customer={selectedCustomer}
      />
    </div>
  );
};
