import { useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { AlertCircle, Bell } from "lucide-react";

export const DuePaymentAlert = () => {
  const { data: notifications } = useNotifications();

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Show toast for due today payments
    const dueToday = notifications.filter((n) => n.type === "due_today");
    const overdue = notifications.filter((n) => n.type === "overdue");

    if (dueToday.length > 0) {
      toast.warning(
        `${dueToday.length} payment${dueToday.length > 1 ? "s" : ""} due today!`,
        {
          description: dueToday.map((n) => n.customerName).join(", "),
          icon: <Bell className="w-5 h-5" />,
          duration: 10000,
        }
      );
    }

    if (overdue.length > 0) {
      toast.error(
        `${overdue.length} overdue payment${overdue.length > 1 ? "s" : ""}!`,
        {
          description: overdue.map((n) => n.customerName).join(", "),
          icon: <AlertCircle className="w-5 h-5" />,
          duration: 10000,
        }
      );
    }
  }, [notifications]);

  return null;
};
