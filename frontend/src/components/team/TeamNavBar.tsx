import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { TeamSettingsMenu } from "@/components/team/TeamSettingsMenu";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { ADMIN_NAV_INNER } from "@/lib/adminLayout";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const palette = ADMIN_PALETTE;

export const TEAM_MENU_ITEMS: StaggeredMenuItem[] = [
  { label: "Today", ariaLabel: "Go to team home", link: "/team" },
  { label: "My tasks", ariaLabel: "View my tasks", link: "/team/tasks" },
];

export function TeamNavBar() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name?.split(/\s+/)[0] ?? "Team";

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className={cn(ADMIN_NAV_INNER, "flex items-center justify-between py-3 lg:py-3.5")}>
        <p className="admin-nav-profile-name truncate">{displayName}</p>

        <div className="flex shrink-0 items-center gap-2">
          <StaggeredMenu
            className="admin-nav-shell"
            position="right"
            items={TEAM_MENU_ITEMS}
            displaySocials={false}
            displayItemNumbering
            showLogo={false}
            menuButtonColor="#000000"
            openMenuButtonColor="#000000"
            accentColor={palette.accent}
            colors={["#e8e8e8", "#b0a7d1", "#9c6dc8"]}
            panelId="team-menu-panel"
            headerExtra={null}
          />
          <TeamSettingsMenu />
        </div>
      </div>
    </div>
  );
}
