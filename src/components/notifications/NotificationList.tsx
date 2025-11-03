import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Notification } from "@/hooks/use-notifications";

interface NotificationListProps {
  notifications: Notification[];
}

export const NotificationList = ({ notifications }: NotificationListProps) => {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No pending notifications</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "due_today":
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="divide-y">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(notification.date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
