import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Archive, Activity, Users } from "lucide-react";
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
      <AdminHero className="lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.textSecondaryOnBg }}>
          {greeting()}, {user?.name ?? "Admin"}
        </p>
        <h1
          className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight lg:text-5xl"
          style={{ color: palette.textOnBg, textShadow: "0 2px 16px rgba(26, 18, 40, 0.22)" }}
        >
          Your production runway for today
        </h1>
        <p className="mt-3 text-lg font-medium lg:text-xl" style={{ color: palette.textSecondaryOnBg }}>
          {friendlyToday()}
        </p>
      </AdminHero>

      <section>
        <AdminSectionLabel>QUICK ACCESS</AdminSectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminHomeShortcut icon={Archive} label="Weddings" onClick={() => navigate("/admin/weddings")} />
          <AdminHomeShortcut icon={Activity} label="Activity" onClick={() => navigate("/admin/activity")} />
          <AdminHomeShortcut icon={Users} label="Team" onClick={() => navigate("/admin/team")} />
        </div>
      </section>

      <section>
        <AdminSectionLabel>DUE TODAY</AdminSectionLabel>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <p style={{ color: palette.textSecondary }}>Loading runway…</p>
          ) : isError ? (
            <AdminSurface>
              <p className="font-medium" style={{ color: palette.text }}>
                Could not load runway
              </p>
              <p className="mt-2 text-sm" style={{ color: palette.textSecondary }}>
                {String(error)}
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-semibold"
                style={{ color: palette.accent }}
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </AdminSurface>
          ) : todayTasks.length === 0 ? (
            <AdminSurface>
              <p className="text-base leading-relaxed" style={{ color: palette.textSecondary }}>
                Nothing due today — you&apos;re clear.
              </p>
            </AdminSurface>
          ) : (
            todayTasks.map((task) => (
              <AdminSurface key={task.id} padding="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-tight" style={{ color: palette.text }}>
                      {task.event?.clientName ?? "Wedding"}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
                      {taskTypeLabel(task.taskType)}
                    </p>
                    {task.assignedTo?.name ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: palette.bronze }}>
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
