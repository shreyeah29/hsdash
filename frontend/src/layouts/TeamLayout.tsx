import { Home, CheckSquare } from "lucide-react";
import { ShellLayout } from "@/layouts/ShellLayout";

export function TeamLayout() {
  return (
    <ShellLayout
      title="Your workspace"
      subtitle="Deliverables & deadlines"
      links={[
        { to: "/team", label: "Today", icon: Home },
        { to: "/team/tasks", label: "My tasks", icon: CheckSquare },
      ]}
      variant="editor"
    />
  );
}
