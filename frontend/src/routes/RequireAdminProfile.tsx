import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAdminWorkspaceStore } from "@/store/adminWorkspace";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types/domain";

export function RequireAdminProfile() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const profile = useAdminWorkspaceStore((s) => s.profile);
  const hydrated = useAdminWorkspaceStore((s) => s.hydrated);
  const hydrate = useAdminWorkspaceStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!user) {
    return <Navigate to="/login/admin" replace />;
  }

  if (user.role !== Role.ADMIN) {
    return <Navigate to="/team" replace />;
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="admin-kicker">Loading workspace…</p>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/admin/profiles" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
