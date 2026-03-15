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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { customers: [], loans: [] };

      // Search matching customers
      const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .or(`name.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%`)
        .limit(5);

      const customerIds = customers?.map(c => c.id) || [];
      const searchAmount = parseFloat(searchQuery);
      const isSearchAmountNumeric = !isNaN(searchAmount) && /^\d/.test(searchQuery);

      let loansQuery = supabase
        .from("loans")
        .select(`*, customers:customer_id (name)`)
        .eq("user_id", user.id)
        .limit(5);

      if (customerIds.length > 0 && isSearchAmountNumeric) {
        loansQuery = loansQuery.or(`customer_id.in.(${customerIds.join(",")}),principal_amount.eq.${searchAmount}`);
      } else if (customerIds.length > 0) {
        loansQuery = loansQuery.in("customer_id", customerIds);
      } else if (isSearchAmountNumeric) {
        loansQuery = loansQuery.eq("principal_amount", searchAmount);
      } else {
        // No customers match and not numeric
        return { customers: customers || [], loans: [] };
      }

      const { data: loans } = await loansQuery;

      return {
        customers: customers || [],
        loans: loans || [],
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
