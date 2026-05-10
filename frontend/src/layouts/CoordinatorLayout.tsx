import { Gauge, CalendarDays, ClipboardPenLine } from "lucide-react";
import { ShellLayout } from "@/layouts/ShellLayout";

export function CoordinatorLayout() {
  return (
    <ShellLayout
      title="Coordinator desk"
      subtitle="Shoot logistics → post-production"
      links={[
        { to: "/coordinator", label: "Command center", icon: Gauge },
        { to: "/coordinator/shoot-calendar", label: "Shoot calendar", icon: CalendarDays },
        { to: "/coordinator/assignments", label: "Assignments", icon: ClipboardPenLine },
      ]}
      variant="coordinator"
    />
  );
}
