import { Home, UserPlus, CalendarDays, Video, LogOut } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { useAdminThemeStore } from "@/store/adminTheme";
import { adminCssVars } from "@/lib/adminTheme";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Home", icon: Home, end: true },
  { to: "/admin/leads", label: "Leads", icon: UserPlus },
  { to: "/admin/deadlines", label: "Deadlines", icon: CalendarDays },
  { to: "/admin/shoots", label: "Shoots", icon: Video },
] as const;

export function AdminLayout() {
  const palette = useAdminThemeStore((s) => s.palette);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const studio = palette.mode === "studio";

  return (
    <div
      className="min-h-screen text-[var(--admin-text)]"
      style={adminCssVars(palette) as React.CSSProperties}
    >
      <AdminPageBackground className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 pb-2 pt-4 md:px-8">
          <img src="/hswf_logo_dark.png" alt="HSWF" className={cn("h-7 w-auto object-contain", studio && "brightness-0 invert")} />
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: palette.border,
              color: palette.textSecondary,
              backgroundColor: studio ? `${palette.card}cc` : palette.card,
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-2 md:px-8">
          <Outlet key={location.pathname} />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t"
          style={{
            backgroundColor: palette.navBar,
            borderColor: studio ? `${palette.border}73` : palette.border,
          }}
        >
          <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
            {NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                className={({ isActive }) =>
                  cn(
                    "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[11px] font-medium transition-colors",
                    isActive ? "font-semibold" : "",
                  )
                }
                style={({ isActive }) => ({
                  color: isActive ? palette.accent : palette.textSecondary,
                  backgroundColor: isActive
                    ? studio
                      ? palette.navIndicator
                      : `${palette.accent}24`
                    : "transparent",
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 1.75} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </AdminPageBackground>
    </div>
  );
}
