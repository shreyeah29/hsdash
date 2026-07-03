import { ShootCalendarPage } from "@/pages/shared/ShootCalendarPage";
import { AdminHero, AdminSectionLabel } from "@/components/admin/AdminSurface";

export function AdminShootsPage() {
  return (
    <div className="space-y-6">
      <AdminHero>
        <AdminSectionLabel>Shoots</AdminSectionLabel>
        <h1 className="admin-display-title mt-3">Production calendar</h1>
        <p className="admin-display-subtitle mt-3 max-w-3xl text-sm">
          Create shoots on the calendar first. Editors are notified when deliverables are assigned — not when the shoot row is saved.
        </p>
      </AdminHero>
      <ShootCalendarPage mode="admin" embedded />
    </div>
  );
}
