import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Role } from "@/types/domain";

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/team" replace />;
  return <>{children}</>;
}

