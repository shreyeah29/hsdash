import { ShellLayout } from "@/layouts/ShellLayout";

export function AdminLayout() {
  return (
    <ShellLayout
      title="Admin"
      links={[
        { to: "/admin", label: "Overview" },
        { to: "/admin/notifications", label: "Team updates" },
        { to: "/admin/tasks", label: "Tasks" },
        { to: "/admin/team", label: "Team Management" },
      ]}
    />
  );
}

