import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Users,
} from "lucide-react";
import { ShellLayout } from "@/layouts/ShellLayout";

export function AdminLayout() {
  return (
    <ShellLayout
      title="Admin"
      links={[
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/production-calendar", label: "Shoot calendar", icon: CalendarDays },
        { to: "/admin/deliverables-status", label: "Deliverables radar", icon: ListTodo },
        { to: "/admin/team", label: "People & access", icon: Users },
      ]}
      variant="default"
    />
  );
}
