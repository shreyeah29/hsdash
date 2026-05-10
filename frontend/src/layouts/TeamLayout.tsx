import { ShellLayout } from "@/layouts/ShellLayout";

/** Editors — assignments + deadlines only (no calendar, no company-wide views). */
export function TeamLayout() {
  const links = [
    { to: "/team", label: "My dashboard" },
    { to: "/team/tasks", label: "My tasks" },
  ];
  return <ShellLayout title="Editor workspace" links={links} variant="editor" />;
}
