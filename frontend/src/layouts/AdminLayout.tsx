import { Outlet, useLocation } from "react-router-dom";
import { AdminNavBar } from "@/components/admin/AdminNavBar";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { useAdminThemeStore } from "@/store/adminTheme";
import { adminCssVars } from "@/lib/adminTheme";

export function AdminLayout() {
  const palette = useAdminThemeStore((s) => s.palette);
  const location = useLocation();

  return (
    <div
      className="min-h-screen text-[var(--admin-text)]"
      style={adminCssVars(palette) as React.CSSProperties}
    >
      <AdminPageBackground className="flex min-h-screen flex-col">
        <AdminNavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-[4.75rem] md:px-8 md:pt-[5.25rem]">
          <Outlet key={location.pathname} />
        </main>
      </AdminPageBackground>
    </div>
  );
}
