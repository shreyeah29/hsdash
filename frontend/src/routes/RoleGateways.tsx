import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types/domain";

export function homeForRole(role: string | undefined) {
  if (role === Role.ADMIN) return "/admin";
  if (role === Role.COORDINATOR) return "/coordinator";
  if (role === Role.EDITOR) return "/team";
  return "/login";
}

/** Editors only — minimal execution workspace. */
export function RequireEditor() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (user.role !== Role.EDITOR) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}

/** Operations coordinator (Emmanuel) — calendar + assignments + pipeline visibility. */
export function RequireCoordinatorRole() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (user.role !== Role.COORDINATOR) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
