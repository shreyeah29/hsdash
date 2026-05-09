import { ShellLayout } from "@/layouts/ShellLayout";

export function TeamLayout() {
  return (
    <ShellLayout
      title="Team Member"
      links={[
        { to: "/team", label: "My Dashboard" },
        { to: "/team/tasks", label: "My Tasks" },
      ]}
    />
  );
}

