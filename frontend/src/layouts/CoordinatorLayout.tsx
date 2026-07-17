import { Outlet, useLocation } from "react-router-dom";
import { CoordinatorNavBar } from "@/components/team/CoordinatorNavBar";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { ADMIN_PALETTE, adminCssVars } from "@/lib/adminTheme";
import { ADMIN_CONTENT, ADMIN_MAIN_TOP } from "@/lib/adminLayout";
import { cn } from "@/lib/utils";
import "@/components/admin/adminMenuAesthetic.css";

export function CoordinatorLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-[var(--admin-text)]" style={adminCssVars(ADMIN_PALETTE) as React.CSSProperties}>
      <AdminPageBackground className="flex min-h-screen flex-col">
        <CoordinatorNavBar />
        <main className={cn(ADMIN_CONTENT, ADMIN_MAIN_TOP, "flex-1 pb-12")}>
          <Outlet key={location.pathname} />
        </main>
      </AdminPageBackground>
    </div>
  );
}
