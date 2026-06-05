import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Users,
  Archive,
  Activity,
  UserPlus,
} from "lucide-react";
import { ShellLayout } from "@/layouts/ShellLayout";

export function AdminLayout() {
  return (
    <ShellLayout
      title="Admin"
      links={[
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/leads", label: "Leads", icon: UserPlus },
        { to: "/admin/production-calendar", label: "Shoot calendar", icon: CalendarDays },
        { to: "/admin/weddings-archive", label: "Weddings archive", icon: Archive },
        { to: "/admin/activity", label: "Team activity", icon: Activity },
        { to: "/admin/deliverables-status", label: "Deliverables radar", icon: ListTodo },
        { to: "/admin/team", label: "People & access", icon: Users },
      ]}
      variant="default"
    />
  );
}
