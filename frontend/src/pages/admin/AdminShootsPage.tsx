import { ShootCalendarPage } from "@/pages/shared/ShootCalendarPage";
import { AdminSectionLabel } from "@/components/admin/AdminSurface";
import { useAdminThemeStore } from "@/store/adminTheme";

export function AdminShootsPage() {
  const palette = useAdminThemeStore((s) => s.palette);

  return (
    <div className="space-y-6">
      <div>
        <AdminSectionLabel>SHOOTS</AdminSectionLabel>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: palette.textOnBg, textShadow: "0 1px 12px rgba(26,18,40,0.22)" }}>
          Production calendar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: palette.textSecondaryOnBg }}>
          Create shoots on the calendar first. Editors are notified when deliverables are assigned — not when the shoot row is saved.
        </p>
      </div>
      <ShootCalendarPage mode="admin" embedded />
    </div>
  );
}
