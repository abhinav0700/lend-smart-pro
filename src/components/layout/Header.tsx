import { Building2, LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SearchBar } from "@/components/search/SearchBar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const { user, userRole, signOut } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Magzhilini Finance</h1>
              <p className="text-sm text-muted-foreground">Lending Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <SearchBar />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground hidden sm:inline">{user?.email}</span>
              <Badge variant="secondary" className="text-xs">
                {userRole?.role}
              </Badge>
            </div>
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
