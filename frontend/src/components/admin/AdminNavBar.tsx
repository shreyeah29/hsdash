import { CalendarDays, Home, LogOut, UserPlus, Video } from "lucide-react";
import { NavLink } from "react-router-dom";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
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
    <div className="sticky top-0 z-50">
      <StaggeredMenu
      position="right"
      items={ADMIN_MENU_ITEMS}
      displaySocials={false}
      displayItemNumbering
      showLogo={false}
      menuButtonColor={palette.textOnBg}
      openMenuButtonColor={palette.textOnBg}
      accentColor={palette.accent}
      colors={["#919191", "#b0a7d1", "#9c6dc8"]}
      headerExtra={
        <div className="flex items-center gap-2 lg:gap-3">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Quick navigation">
            {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors lg:px-4 lg:py-2.5",
                    isActive ? "font-semibold" : "",
                  )
                }
                style={({ isActive }) => ({
                  borderColor: isActive ? `${palette.accent}66` : "rgba(255,255,255,0.45)",
                  color: isActive ? palette.textOnBg : palette.textSecondaryOnBg,
                  backgroundColor: isActive ? palette.navIndicator : palette.navBar,
                })}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <nav className="flex items-center gap-1 md:hidden" aria-label="Quick navigation">
            {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                    isActive ? "font-semibold" : "",
                  )
                }
                style={({ isActive }) => ({
                  borderColor: isActive ? `${palette.accent}66` : "rgba(255,255,255,0.45)",
                  color: isActive ? palette.accent : palette.textSecondaryOnBg,
                  backgroundColor: isActive ? palette.navIndicator : palette.navBar,
                })}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="sr-only">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors lg:h-11 lg:px-4"
            style={{
              borderColor: "rgba(255,255,255,0.45)",
              color: palette.textSecondaryOnBg,
              backgroundColor: palette.navBar,
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      }
    />
    </div>
  );
}
