import { AdminDeliverablesRunway } from "@/components/admin/AdminDeliverablesRunway";
import { AdminSectionLabel } from "@/components/admin/AdminSurface";
import { useAdminThemeStore } from "@/store/adminTheme";

export function AdminDeadlinesPage() {
  const palette = useAdminThemeStore((s) => s.palette);

  return (
    <div className="space-y-6">
      <div>
        <AdminSectionLabel>DEADLINES</AdminSectionLabel>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: palette.textOnBg, textShadow: "0 1px 12px rgba(26,18,40,0.22)" }}>
          Deliverable runway
        </h1>
        <p className="mt-2 text-sm" style={{ color: palette.textSecondaryOnBg }}>
          Open deliverables by due date — same view as the mobile Deadlines tab.
        </p>
      </div>
      <AdminDeliverablesRunway />
    </div>
  );
}
