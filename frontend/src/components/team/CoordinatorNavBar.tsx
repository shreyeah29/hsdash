import { NavLink } from "react-router-dom";
import { ADMIN_NAV_INNER } from "@/lib/adminLayout";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/coordinator", label: "Command center", end: true },
  { to: "/coordinator/shoot-calendar", label: "Shoot calendar", end: false },
  { to: "/coordinator/assignments", label: "Assignments", end: false },
] as const;

export function CoordinatorNavBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const displayName = user?.name?.split(/\s+/)[0] ?? "Coordinator";

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className={cn(ADMIN_NAV_INNER, "flex flex-wrap items-center justify-between gap-3 py-3 lg:py-3.5")}>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="admin-nav-profile-name truncate">{displayName}</p>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Coordinator">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cn("admin-nav-pill", isActive && "admin-nav-pill--active")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <button type="button" className="admin-menu-btn shrink-0" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
