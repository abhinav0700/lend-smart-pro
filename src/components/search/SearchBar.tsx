import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  onSelectCustomer?: (customerId: string) => void;
  onSelectLoan?: (loanId: string) => void;
}

export const SearchBar = ({ onSelectCustomer, onSelectLoan }: SearchBarProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { customers: [], loans: [] };

      const [customersResult, loansResult] = await Promise.all([
        supabase
          .from("customers")
          .select("*")
          .or(`name.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%`)
          .limit(5),
        supabase
          .from("loans")
          .select(`*, customers:customer_id (name)`)
          .limit(5),
      ]);

      return {
        customers: customersResult.data || [],
        loans: loansResult.data || [],
      };
    },
    enabled: searchQuery.length >= 2,
  });

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers, loans..."
          className="pl-10"
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search customers, loans..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {searchResults?.customers && searchResults.customers.length > 0 && (
            <CommandGroup heading="Customers">
              {searchResults.customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => {
                    onSelectCustomer?.(customer.id);
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.contact_number}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {searchResults?.loans && searchResults.loans.length > 0 && (
            <CommandGroup heading="Loans">
              {searchResults.loans.map((loan) => (
                <CommandItem
                  key={loan.id}
                  onSelect={() => {
                    onSelectLoan?.(loan.id);
                    setOpen(false);
                  }}
                >
                  <div>
                    <p className="font-medium">{loan.customers?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {loan.loan_type === "fixed_interest" ? "Fixed Interest" : "EMI"} - ₹
                      {Number(loan.principal_amount).toLocaleString()}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
