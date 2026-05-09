import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { isProductionCoordinatorUser } from "@/lib/productionCoordinator";

export function RequireProductionCoordinator() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!isProductionCoordinatorUser(user.email)) return <Navigate to="/team" replace />;
  return <Outlet />;
}
