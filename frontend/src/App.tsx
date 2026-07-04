import { Navigate, Route, Routes } from "react-router-dom";
import { PublicEnquiryPage } from "@/pages/PublicEnquiryPage";
import { LoginChoicePage } from "@/pages/LoginChoicePage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminSectionLayout } from "@/layouts/AdminSectionLayout";
import { TeamLayout } from "@/layouts/TeamLayout";
import { TeamSectionLayout } from "@/layouts/TeamSectionLayout";
import { CoordinatorLayout } from "@/layouts/CoordinatorLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminDeadlinesPage } from "@/pages/admin/AdminDeadlinesPage";
import { AdminShootsPage } from "@/pages/admin/AdminShootsPage";
import { TasksPage } from "@/pages/shared/TasksPage";
import { TeamManagementPage } from "@/pages/admin/TeamManagementPage";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage";
import { WeddingsArchivePage } from "@/pages/admin/WeddingsArchivePage";
import { TeamDashboardPage } from "@/pages/team/TeamDashboardPage";
import { CoordinatorDashboardPage } from "@/pages/team/CoordinatorDashboardPage";
import { ShootCalendarPage } from "@/pages/shared/ShootCalendarPage";
import { CoordinatorTasksPage } from "@/pages/team/CoordinatorTasksPage";
import { AssignmentsBoardPage } from "@/pages/shared/AssignmentsBoardPage";
import { AdminLeadsPage } from "@/pages/admin/AdminLeadsPage";
import { PublicQuotationPage } from "@/pages/quotation/PublicQuotationPage";
import { QuotationBuilderPage } from "@/pages/quotation/QuotationBuilderPage";
import { AdminProfileSelectionPage } from "@/pages/admin/AdminProfileSelectionPage";
import { RequireAdminProfile } from "@/routes/RequireAdminProfile";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { RequireEditor, RequireCoordinatorRole } from "@/routes/RoleGateways";
import { RealtimeSync } from "@/routes/RealtimeSync";
import { Role } from "@/types/domain";

function App() {
  return (
    <Routes>
      <Route path="/enquiry" element={<PublicEnquiryPage />} />
      <Route path="/q/:slug" element={<PublicQuotationPage />} />
      <Route path="/login" element={<LoginChoicePage />} />
      <Route path="/login/admin" element={<LoginPage loginKind="admin" />} />
      <Route path="/login/team" element={<LoginPage loginKind="team" />} />

      <Route element={<RequireAuth />}>
        <Route
          path="/admin/quotations/builder/:leadId"
          element={
            <RequireRole role={Role.ADMIN}>
              <QuotationBuilderPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/profiles"
          element={
            <RequireRole role={Role.ADMIN}>
              <AdminProfileSelectionPage />
            </RequireRole>
          }
        />
        <Route element={<RealtimeSync />}>
          <Route element={<RequireAdminProfile />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="leads" element={<AdminLeadsPage />} />
              <Route path="deadlines" element={<AdminDeadlinesPage />} />
              <Route path="shoots" element={<AdminShootsPage />} />
              <Route path="production-calendar" element={<Navigate to="/admin/shoots" replace />} />
              <Route path="deliverables-status" element={<Navigate to="/admin/deadlines" replace />} />
              <Route path="tasks" element={<Navigate to="/admin/deadlines" replace />} />
              <Route path="assignments" element={<AssignmentsBoardPage mode="admin" />} />
              <Route path="assign-deliverables" element={<Navigate to="/admin/assignments" replace />} />
            </Route>

            <Route path="/admin/weddings" element={<AdminSectionLayout title="Weddings" />}>
              <Route index element={<WeddingsArchivePage />} />
            </Route>
            <Route path="/admin/weddings-archive" element={<Navigate to="/admin/weddings" replace />} />

            <Route path="/admin/activity" element={<AdminSectionLayout title="Activity" />}>
              <Route index element={<AdminNotificationsPage />} />
            </Route>
            <Route path="/admin/notifications" element={<Navigate to="/admin/activity" replace />} />

            <Route path="/admin/team" element={<AdminSectionLayout title="Team" />}>
              <Route index element={<TeamManagementPage />} />
            </Route>
          </Route>

          <Route element={<RequireCoordinatorRole />}>
            <Route path="/coordinator" element={<CoordinatorLayout />}>
              <Route index element={<CoordinatorDashboardPage />} />
              <Route path="shoot-calendar" element={<ShootCalendarPage mode="coordinator" />} />
              <Route path="assignments" element={<CoordinatorTasksPage />} />
            </Route>
          </Route>

          <Route element={<RequireEditor />}>
            <Route path="/team" element={<TeamLayout />}>
              <Route index element={<TeamDashboardPage />} />
            </Route>
            <Route path="/team/tasks" element={<TeamSectionLayout title="My tasks" />}>
              <Route index element={<TasksPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
