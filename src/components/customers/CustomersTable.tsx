import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface CustomersTableProps {
  customers: any[];
  onEdit: (customer: any) => void;
  onRefetch: () => void;
}

export const CustomersTable = ({ customers, onEdit, onRefetch }: CustomersTableProps) => {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? All associated loans will be deleted.")) {
      return;
    }

    const { error } = await supabase.from("customers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete customer");
    } else {
      toast.success("Customer deleted successfully");
      onRefetch();
    }
  };

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No customers found. Add your first customer to get started.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>ID Proof</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.contact_number}</TableCell>
              <TableCell>{customer.address || "-"}</TableCell>
              <TableCell>{customer.id_proof || "-"}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(customer.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
