import { ShootCalendarPage } from "@/pages/shared/ShootCalendarPage";
import { AdminSectionLabel } from "@/components/admin/AdminSurface";
import { useAdminThemeStore } from "@/store/adminTheme";

export function AdminShootsPage() {
  const palette = useAdminThemeStore((s) => s.palette);

  return (
    <div className="space-y-6">
      <div>
        <AdminSectionLabel>SHOOTS</AdminSectionLabel>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight" style={{ color: palette.text }}>
          Production calendar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: palette.textSecondary }}>
          Create shoots on the calendar first. Editors are notified when deliverables are assigned — not when the shoot row is saved.
        </p>
      </div>
      <ShootCalendarPage mode="admin" embedded />
    </div>
  );
}
