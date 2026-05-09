import { ShellLayout } from "@/layouts/ShellLayout";

export function AdminLayout() {
  return (
    <ShellLayout
      title="Admin"
      links={[
        { to: "/admin", label: "Overview" },
        { to: "/admin/production-calendar", label: "Production calendar" },
        { to: "/admin/deliverables-status", label: "Deliverables status" },
        { to: "/admin/notifications", label: "Team updates" },
        { to: "/admin/team", label: "Team Management" },
      ]}
    />
  );
}

