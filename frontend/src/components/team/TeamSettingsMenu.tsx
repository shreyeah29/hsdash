import { useMemo, useState } from "react";
import { StaggeredMenu, type StaggeredMenuItem } from "@/components/admin/StaggeredMenu";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { useAuthStore } from "@/store/auth";
import { AdminChangePasswordDialog, AdminChangeUsernameDialog } from "@/components/admin/AdminAccountDialogs";

const palette = ADMIN_PALETTE;

export function TeamSettingsMenu() {
  const logout = useAuthStore((s) => s.logout);
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const items = useMemo<StaggeredMenuItem[]>(
    () => [
      {
        label: "Change username",
        ariaLabel: "Change username",
        onClick: () => setUsernameOpen(true),
      },
      {
        label: "Change password",
        ariaLabel: "Change password",
        onClick: () => setPasswordOpen(true),
      },
      {
        label: "Sign out",
        ariaLabel: "Sign out",
        variant: "danger",
        onClick: () => void logout(),
      },
    ],
    [logout],
  );

  return (
    <>
      <StaggeredMenu
        className="admin-nav-shell"
        position="right"
        items={items}
        displaySocials={false}
        displayItemNumbering
        showLogo={false}
        menuButtonColor="#000000"
        openMenuButtonColor="#000000"
        accentColor={palette.accent}
        colors={["#e8e8e8", "#b0a7d1", "#9c6dc8"]}
        toggleLabels={{ closed: "Settings", open: "Close" }}
        panelId="team-settings-panel"
        headerExtra={null}
      />
      <AdminChangeUsernameDialog open={usernameOpen} onOpenChange={setUsernameOpen} />
      <AdminChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
