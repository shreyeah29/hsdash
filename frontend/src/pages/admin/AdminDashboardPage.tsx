import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Archive, Activity, Users } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { AdminHomeShortcut, AdminSectionLabel, AdminSurface } from "@/components/admin/AdminSurface";
import { useAdminThemeStore } from "@/store/adminTheme";
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
  return now.toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const palette = useAdminThemeStore((s) => s.palette);
  const user = useAuthStore((s) => s.user);
  const studio = palette.mode === "studio";
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
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[28px] px-1 pt-2">
        <div
          className="pointer-events-none absolute -left-16 -top-24 h-60 w-60 rounded-full blur-3xl"
          style={{ backgroundColor: studio ? `${palette.accent}52` : `${palette.backdropAccent}3d` }}
        />
        {studio ? (
          <div
            className="pointer-events-none absolute -right-12 top-8 h-44 w-44 rounded-full blur-3xl"
            style={{ backgroundColor: "#4C1D9533" }}
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: palette.textSecondary }}>
              {greeting()}
            </p>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight" style={{ color: palette.text }}>
              {user?.name ?? "Admin"}
            </h2>
          </div>
          <AdminThemeToggle />
        </div>

        <div className="relative mt-7 space-y-1">
          <h1
            className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em]"
            style={{
              background: studio
                ? `linear-gradient(135deg, ${palette.text}, ${palette.heroGradientEnd})`
                : `linear-gradient(135deg, ${palette.ivory}, ${palette.accent})`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            This is your
            <br />
            production runway
            <br />
            for today
          </h1>
          <p className="pt-2 text-xl font-semibold" style={{ color: palette.accent }}>
            {friendlyToday()}
          </p>
        </div>
      </section>

      <section>
        <AdminSectionLabel>QUICK ACCESS</AdminSectionLabel>
        <div className="mt-4 flex gap-3">
          <AdminHomeShortcut icon={Archive} label="Weddings" onClick={() => navigate("/admin/weddings")} />
          <AdminHomeShortcut icon={Activity} label="Activity" onClick={() => navigate("/admin/activity")} />
          <AdminHomeShortcut icon={Users} label="Team" onClick={() => navigate("/admin/team")} />
        </div>
      </section>

      <section>
        <AdminSectionLabel>DUE TODAY</AdminSectionLabel>
        <div className="mt-4 space-y-3">
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
            <p className="text-[15px] leading-relaxed" style={{ color: palette.textSecondary }}>
              Nothing due today — you&apos;re clear for {friendlyToday()}.
            </p>
          ) : (
            todayTasks.map((task) => (
              <AdminSurface key={task.id} padding="p-4">
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
