import { Building2 } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SearchBar } from "@/components/search/SearchBar";

export const Header = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">LendTrack</h1>
              <p className="text-sm text-muted-foreground">Lending Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchBar />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};
