import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedTooltip, type AnimatedTooltipItem } from "@/components/ui/animated-tooltip";
import { AdminPageBackground } from "@/components/admin/AdminPageBackground";
import { ADMIN_PALETTE, adminCssVars } from "@/lib/adminTheme";
import { ADMIN_WORKSPACE_PROFILES } from "@/lib/adminProfiles";
import type { AdminWorkspaceProfileId } from "@/lib/adminProfiles";
import { useAdminWorkspaceStore } from "@/store/adminWorkspace";
import "@/components/admin/adminMenuAesthetic.css";

const tooltipItems: AnimatedTooltipItem[] = ADMIN_WORKSPACE_PROFILES.map((p, i) => ({
  id: i + 1,
  name: p.name,
  designation: p.designation,
  image: p.image,
}));

const idByTooltipId = new Map(tooltipItems.map((item, i) => [item.id, ADMIN_WORKSPACE_PROFILES[i]!.id]));

export function AdminProfileSelectionPage() {
  const navigate = useNavigate();
  const hydrate = useAdminWorkspaceStore((s) => s.hydrate);
  const selectProfile = useAdminWorkspaceStore((s) => s.selectProfile);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  async function handleSelect(item: AnimatedTooltipItem) {
    if (selecting) return;
    const profileId = idByTooltipId.get(item.id);
    if (!profileId) return;
    setSelecting(true);
    selectProfile(profileId as AdminWorkspaceProfileId);
    await new Promise((r) => setTimeout(r, 280));
    navigate("/admin", { replace: true });
  }

  return (
    <div className="min-h-screen" style={adminCssVars(ADMIN_PALETTE) as React.CSSProperties}>
      <AdminPageBackground className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="admin-card w-full max-w-xl border-2 border-black p-8 text-center shadow-[8px_8px_0_#000] lg:p-12">
          <p className="admin-kicker">Admin workspace</p>
          <h1 className="admin-display-hero mt-4 text-3xl lg:text-4xl">Choose a profile</h1>
          <p className="admin-display-subtitle mx-auto mt-4 max-w-sm text-sm lg:text-base">
            Pick who&apos;s running the dashboard today. Same data for every profile — cosmetic only.
          </p>

          <div className="mt-10 flex justify-center">
            <AnimatedTooltip items={tooltipItems} onSelect={(item) => void handleSelect(item)} />
          </div>

          <p className="admin-display-subtitle mt-8 text-xs">
            {selecting ? "Opening dashboard…" : "Hover for details · click to continue"}
          </p>
        </div>
      </AdminPageBackground>
    </div>
  );
}
