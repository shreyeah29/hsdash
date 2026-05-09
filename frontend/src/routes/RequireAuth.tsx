import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

export function RequireAuth() {
  const { user, loading, refreshMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

