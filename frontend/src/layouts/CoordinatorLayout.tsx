import { ShellLayout } from "@/layouts/ShellLayout";

/** Operations coordinator — bridge between shoot logistics and post-production. */
export function CoordinatorLayout() {
  const links = [
    { to: "/coordinator", label: "Command center" },
    { to: "/coordinator/shoot-calendar", label: "Shoot calendar" },
    { to: "/coordinator/assignments", label: "Assignments" },
  ];
  return <ShellLayout title="Production coordinator" links={links} variant="coordinator" />;
}
