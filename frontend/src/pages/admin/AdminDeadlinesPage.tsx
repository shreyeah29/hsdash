import { AdminDeliverablesRunway } from "@/components/admin/AdminDeliverablesRunway";
import { AdminHero, AdminSectionLabel } from "@/components/admin/AdminSurface";

export function AdminDeadlinesPage() {
  return (
    <div className="space-y-6">
      <AdminHero>
        <AdminSectionLabel>Deadlines</AdminSectionLabel>
        <h1 className="admin-display-title mt-3">Deliverable runway</h1>
        <p className="admin-display-subtitle mt-3 text-sm">
          Open deliverables by due date — same view as the mobile Deadlines tab.
        </p>
      </AdminHero>
      <AdminDeliverablesRunway />
    </div>
  );
}
