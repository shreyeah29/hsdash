import { Navigate, Route, Routes } from "react-router-dom";
import { LoginChoicePage } from "@/pages/LoginChoicePage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { TeamLayout } from "@/layouts/TeamLayout";
import { CoordinatorLayout } from "@/layouts/CoordinatorLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { TasksPage } from "@/pages/shared/TasksPage";
import { TeamManagementPage } from "@/pages/admin/TeamManagementPage";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage";
import { TeamDashboardPage } from "@/pages/team/TeamDashboardPage";
import { CoordinatorDashboardPage } from "@/pages/team/CoordinatorDashboardPage";
import { ShootCalendarPage } from "@/pages/shared/ShootCalendarPage";
import { CoordinatorTasksPage } from "@/pages/team/CoordinatorTasksPage";
import { AdminDeliverablesStatusPage } from "@/pages/admin/AdminDeliverablesStatusPage";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { RequireEditor, RequireCoordinatorRole } from "@/routes/RoleGateways";
import { RealtimeSync } from "@/routes/RealtimeSync";
import { Role } from "@/types/domain";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginChoicePage />} />
      <Route path="/login/admin" element={<LoginPage loginKind="admin" />} />
      <Route path="/login/team" element={<LoginPage loginKind="team" />} />

      <Route element={<RequireAuth />}>
        <Route element={<RealtimeSync />}>
          <Route
            path="/admin"
            element={
              <RequireRole role={Role.ADMIN}>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="production-calendar" element={<ShootCalendarPage mode="admin" />} />
            <Route path="deliverables-status" element={<AdminDeliverablesStatusPage />} />
            <Route path="assign-deliverables" element={<Navigate to="/admin/deliverables-status" replace />} />
            <Route path="tasks" element={<Navigate to="/admin/deliverables-status" replace />} />
            <Route path="team" element={<TeamManagementPage />} />
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
              <Route path="tasks" element={<TasksPage />} />
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
