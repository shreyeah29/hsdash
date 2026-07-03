import { CalendarDays, Home, LogOut, UserPlus, Video } from "lucide-react";
import { NavLink } from "react-router-dom";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { ADMIN_NAV_INNER } from "@/lib/adminLayout";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const palette = ADMIN_PALETTE;

const QUICK_NAV = [
  { to: "/admin", label: "Home", icon: Home, end: true },
  { to: "/admin/leads", label: "Leads", icon: UserPlus },
  { to: "/admin/deadlines", label: "Deadlines", icon: CalendarDays },
  { to: "/admin/shoots", label: "Shoots", icon: Video },
] as const;

export const ADMIN_MENU_ITEMS: StaggeredMenuItem[] = [
  { label: "Home", ariaLabel: "Go to admin home", link: "/admin" },
  { label: "Leads", ariaLabel: "View leads pipeline", link: "/admin/leads" },
  { label: "Deadlines", ariaLabel: "View deliverable deadlines", link: "/admin/deadlines" },
  { label: "Shoots", ariaLabel: "Open production calendar", link: "/admin/shoots" },
  { label: "Weddings", ariaLabel: "Browse weddings archive", link: "/admin/weddings" },
  { label: "Activity", ariaLabel: "Team activity feed", link: "/admin/activity" },
  { label: "Team", ariaLabel: "Manage people and access", link: "/admin/team" },
];

export function AdminNavBar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className={cn(ADMIN_NAV_INNER, "py-3 lg:py-3.5")}>
        <nav className="hidden min-w-0 flex-1 items-center gap-2 md:flex" aria-label="Quick navigation">
          {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              className={({ isActive }) =>
                cn("admin-nav-pill rounded-none px-3 py-2 lg:px-4 lg:py-2.5", isActive ? "admin-nav-pill--active" : "")
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <nav className="flex flex-1 items-center gap-1.5 md:hidden" aria-label="Quick navigation">
          {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              title={label}
              className={({ isActive }) =>
                cn(
                  "admin-nav-pill flex h-10 w-10 items-center justify-center rounded-none p-0",
                  isActive ? "admin-nav-pill--active" : "",
                )
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <StaggeredMenu
            className="admin-nav-shell"
            position="right"
            items={ADMIN_MENU_ITEMS}
            displaySocials={false}
            displayItemNumbering
            showLogo={false}
            menuButtonColor="#000000"
            openMenuButtonColor="#000000"
            accentColor={palette.accent}
            colors={["#e8e8e8", "#b0a7d1", "#9c6dc8"]}
            headerExtra={null}
          />
          <button type="button" onClick={() => void logout()} className="admin-menu-btn">
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
