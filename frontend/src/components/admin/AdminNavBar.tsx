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

const navPillStyle = (isActive: boolean) => ({
  borderColor: isActive ? `${palette.accent}88` : "rgba(255,255,255,0.42)",
  color: isActive ? palette.textOnBg : palette.textSecondaryOnBg,
  backgroundColor: isActive ? palette.navIndicator : palette.navBar,
});

export function AdminNavBar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/20 bg-black/10 backdrop-blur-md">
      <div className={cn(ADMIN_NAV_INNER, "py-3 lg:py-4")}>
        <nav className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex lg:gap-2" aria-label="Quick navigation">
          {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors lg:px-5 lg:py-2.5 lg:text-[15px]",
                  isActive ? "font-semibold shadow-sm" : "",
                )
              }
              style={({ isActive }) => navPillStyle(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0 lg:h-[18px] lg:w-[18px]" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <nav className="flex flex-1 items-center gap-1 md:hidden" aria-label="Quick navigation">
          {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in rest}
              title={label}
              className={({ isActive }) =>
                cn("flex h-10 w-10 items-center justify-center rounded-xl border transition-colors", isActive ? "font-semibold" : "")
              }
              style={({ isActive }) => navPillStyle(isActive)}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <StaggeredMenu
            className="admin-nav-shell"
            position="right"
            items={ADMIN_MENU_ITEMS}
            displaySocials={false}
            displayItemNumbering
            showLogo={false}
            menuButtonColor={palette.textOnBg}
            openMenuButtonColor={palette.textOnBg}
            accentColor={palette.accent}
            colors={["#919191", "#b0a7d1", "#9c6dc8"]}
            headerExtra={null}
          />
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors lg:h-11 lg:px-5 lg:text-[15px]"
            style={{
              borderColor: "rgba(255,255,255,0.42)",
              color: palette.textSecondaryOnBg,
              backgroundColor: palette.navBar,
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
