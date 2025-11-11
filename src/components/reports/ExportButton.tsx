import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: "loans" | "customers" | "payments";
}

export const ExportButton = ({ data, filename, type }: ExportButtonProps) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === "loans") {
      headers = ["Customer", "Loan Type", "Principal", "Interest Rate", "EMI", "Status", "Start Date"];
      rows = data.map((loan) => [
        loan.customers?.name || "N/A",
        loan.loan_type === "fixed_interest" ? "Fixed Interest" : "EMI",
        loan.principal_amount,
        loan.interest_rate || "N/A",
        loan.emi_amount || "N/A",
        loan.status,
        new Date(loan.start_date).toLocaleDateString(),
      ]);
    } else if (type === "customers") {
      headers = ["Name", "Contact", "Address", "ID Proof"];
      rows = data.map((customer) => [
        customer.name,
        customer.contact_number,
        customer.address || "N/A",
        customer.id_proof || "N/A",
      ]);
    } else if (type === "payments") {
      headers = ["Customer", "Amount", "Payment Type", "Date", "Notes"];
      rows = data.map((payment) => [
        payment.customers?.name || "N/A",
        payment.amount,
        payment.payment_type,
        new Date(payment.payment_date).toLocaleDateString(),
        payment.notes || "N/A",
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data exported successfully");
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data exported successfully");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <Download className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
