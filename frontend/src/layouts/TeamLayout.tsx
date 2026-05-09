import { ShellLayout } from "@/layouts/ShellLayout";
import { useAuthStore } from "@/store/auth";
import { isProductionCoordinatorUser } from "@/lib/productionCoordinator";

export function TeamLayout() {
  const user = useAuthStore((s) => s.user);
  const links = [{ to: "/team", label: "My Dashboard" }, { to: "/team/tasks", label: "My Tasks" }];
  if (isProductionCoordinatorUser(user?.email)) {
    links.push({ to: "/team/production-calendar", label: "Production calendar" });
    links.push({ to: "/team/assign-deliverables", label: "Assign deliverables" });
  }
  return <ShellLayout title="Team Member" links={links} />;
}

