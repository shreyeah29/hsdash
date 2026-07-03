import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { AdminHomeShortcut, AdminHero, AdminSectionLabel, AdminSurface } from "@/components/admin/AdminSurface";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { useAuthStore } from "@/store/auth";
import { calendarDayKeyFromIso, localDayKey } from "@/lib/calendarUtils";
import { taskTypeLabel } from "@/lib/calendarUtils";
import { StatusBadge } from "@/components/StatusBadge";

type OverviewPayload = { tasks: Task[] };

async function fetchOverviewTasks() {
  const { data } = await api.get<OverviewPayload>("/admin/overview");
  return data.tasks;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function friendlyToday() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

const palette = ADMIN_PALETTE;

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const todayKey = localDayKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const { data: tasks = [], isLoading, refetch, isError, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchOverviewTasks,
    refetchOnWindowFocus: true,
  });

  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== TaskStatus.COMPLETED && calendarDayKeyFromIso(t.deadline) === todayKey)
      .sort((a, b) => a.taskType.localeCompare(b.taskType));
  }, [tasks, todayKey]);

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminHero>
        <p className="admin-kicker">
          {greeting()}, {user?.name ?? "Admin"}
        </p>
        <h1 className="admin-display-hero mt-4 max-w-5xl">Your production runway for today</h1>
        <p className="admin-display-subtitle mt-4 text-base lg:text-lg">{friendlyToday()}</p>
      </AdminHero>

      <section>
        <AdminSectionLabel>Quick access</AdminSectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminHomeShortcut label="Leads" index="02" onClick={() => navigate("/admin/leads")} />
          <AdminHomeShortcut label="Deadlines" index="03" onClick={() => navigate("/admin/deadlines")} />
          <AdminHomeShortcut label="Weddings" index="05" onClick={() => navigate("/admin/weddings")} />
          <AdminHomeShortcut label="Team" index="07" onClick={() => navigate("/admin/team")} />
        </div>
      </section>

      <section>
        <AdminSectionLabel>Due today</AdminSectionLabel>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <p className="admin-display-subtitle">Loading runway…</p>
          ) : isError ? (
            <AdminSurface>
              <p className="admin-display-title text-xl">Could not load runway</p>
              <p className="admin-display-subtitle mt-2 text-sm">{String(error)}</p>
              <button type="button" className="admin-btn admin-btn--solid mt-4" onClick={() => void refetch()}>
                Retry
              </button>
            </AdminSurface>
          ) : todayTasks.length === 0 ? (
            <AdminSurface>
              <p className="admin-display-subtitle text-base">Nothing due today — you&apos;re clear.</p>
            </AdminSurface>
          ) : (
            todayTasks.map((task) => (
              <AdminSurface key={task.id} padding="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold uppercase tracking-tight text-black">
                      {task.event?.clientName ?? "Wedding"}
                    </p>
                    <p className="admin-display-subtitle mt-1 text-sm">{taskTypeLabel(task.taskType)}</p>
                    {task.assignedTo?.name ? (
                      <p className="admin-kicker mt-2" style={{ color: palette.accent }}>
                        {task.assignedTo.name}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              </AdminSurface>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
