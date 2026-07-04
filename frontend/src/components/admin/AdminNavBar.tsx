import { useEffect } from "react";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { AdminSettingsMenu } from "@/components/admin/AdminSettingsMenu";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { ADMIN_NAV_INNER } from "@/lib/adminLayout";
import { useAdminWorkspaceStore } from "@/store/adminWorkspace";
import { cn } from "@/lib/utils";

const palette = ADMIN_PALETTE;

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
  const profile = useAdminWorkspaceStore((s) => s.profile);
  const hydrate = useAdminWorkspaceStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className={cn(ADMIN_NAV_INNER, "flex items-center justify-between py-3 lg:py-3.5")}>
        <div className="flex min-w-0 items-center gap-3">
          {profile ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="h-9 w-9 rounded-full border-2 border-black object-cover object-top lg:h-10 lg:w-10"
            />
          ) : null}
          <p className="admin-nav-profile-name truncate">{profile ? profile.name : "Admin"}</p>
        </div>

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
          <AdminSettingsMenu />
        </div>
      </div>
    </div>
  );
}
