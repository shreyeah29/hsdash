import { CalendarDays, Home, LogOut, UserPlus, Video } from "lucide-react";
import { NavLink } from "react-router-dom";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { useAdminThemeStore } from "@/store/adminTheme";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

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
  const palette = useAdminThemeStore((s) => s.palette);
  const studio = palette.mode === "studio";
  const logout = useAuthStore((s) => s.logout);

  return (
    <StaggeredMenu
      isFixed
      position="right"
      items={ADMIN_MENU_ITEMS}
      displaySocials={false}
      displayItemNumbering
      logoUrl="/hswf_logo_dark.png"
      logoClassName={studio ? "brightness-0 invert" : undefined}
      menuButtonColor={palette.text}
      openMenuButtonColor={palette.text}
      accentColor={palette.accent}
      colors={studio ? ["#4C1D95", "#8B5CF6"] : ["#D4C4B0", "#8B6A45"]}
      headerExtra={
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Quick navigation">
            {QUICK_NAV.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors sm:h-11 sm:w-11",
                    isActive ? "font-semibold" : "",
                  )
                }
                style={({ isActive }) => ({
                  borderColor: isActive ? `${palette.accent}66` : palette.border,
                  color: isActive ? palette.accent : palette.textSecondary,
                  backgroundColor: isActive
                    ? studio
                      ? palette.navIndicator
                      : `${palette.accent}1f`
                    : studio
                      ? `${palette.card}99`
                      : palette.card,
                })}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="sr-only">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            className="hidden h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors sm:inline-flex sm:h-11"
            style={{
              borderColor: palette.border,
              color: palette.textSecondary,
              backgroundColor: studio ? `${palette.card}99` : palette.card,
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      }
    />
  );
}
