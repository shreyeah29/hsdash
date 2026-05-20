import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Bell,
  Users,
  ClipboardPenLine,
} from "lucide-react";
import { ShellLayout } from "@/layouts/ShellLayout";

export function AdminLayout() {
  return (
    <ShellLayout
      title="Studio command"
      subtitle="Company-wide production overview"
      links={[
        { to: "/admin", label: "Mission overview", icon: LayoutDashboard },
        { to: "/admin/production-calendar", label: "Shoot calendar", icon: CalendarDays },
        { to: "/admin/assignments", label: "Assign crew", icon: ClipboardPenLine },
        { to: "/admin/deliverables-status", label: "Deliverables radar", icon: ListTodo },
        { to: "/admin/notifications", label: "Team signals", icon: Bell },
        { to: "/admin/team", label: "People & access", icon: Users },
      ]}
      variant="default"
    />
  );
}
