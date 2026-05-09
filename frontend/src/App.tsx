import { Navigate, Route, Routes } from "react-router-dom";
import { LoginChoicePage } from "@/pages/LoginChoicePage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { TeamLayout } from "@/layouts/TeamLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { TasksPage } from "@/pages/shared/TasksPage";
import { TeamManagementPage } from "@/pages/admin/TeamManagementPage";
import { AdminNotificationsPage } from "@/pages/admin/AdminNotificationsPage";
import { TeamDashboardPage } from "@/pages/team/TeamDashboardPage";
import { ProductionCalendarPage } from "@/pages/team/ProductionCalendarPage";
import { CoordinatorTasksPage } from "@/pages/team/CoordinatorTasksPage";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { RequireProductionCoordinator } from "@/routes/RequireProductionCoordinator";
import { Role } from "@/types/domain";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginChoicePage />} />
      <Route path="/login/admin" element={<LoginPage loginKind="admin" />} />
      <Route path="/login/team" element={<LoginPage loginKind="team" />} />

      <Route element={<RequireAuth />}>
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
          <Route path="tasks" element={<TasksPage />} />
          <Route path="team" element={<TeamManagementPage />} />
        </Route>

        <Route path="/team" element={<TeamLayout />}>
          <Route index element={<TeamDashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route element={<RequireProductionCoordinator />}>
            <Route path="production-calendar" element={<ProductionCalendarPage />} />
            <Route path="assign-deliverables" element={<CoordinatorTasksPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
