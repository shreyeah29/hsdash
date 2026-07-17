import { ADMIN_NAV_INNER } from "@/lib/adminLayout";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export function CoordinatorNavBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const displayName = user?.name?.split(/\s+/)[0] ?? "Coordinator";

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className={cn(ADMIN_NAV_INNER, "flex flex-wrap items-center justify-between gap-3 py-3 lg:py-3.5")}>
        <p className="admin-nav-profile-name min-w-0 truncate">{displayName}</p>

        <button type="button" className="admin-menu-btn shrink-0" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
