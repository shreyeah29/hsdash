import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { AdminHero, AdminHomeShortcut, AdminSectionLabel, AdminSurface } from "@/components/admin/AdminSurface";
import { AdminStatCard } from "@/components/admin/AdminUi";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { useAuthStore } from "@/store/auth";
import { taskTypeLabel } from "@/lib/calendarUtils";
import { StatusBadge } from "@/components/StatusBadge";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthRangeIso(y: number, monthIndex: number) {
  const last = new Date(y, monthIndex + 1, 0);
  return { from: `${y}-${pad2(monthIndex + 1)}-01`, to: `${y}-${pad2(monthIndex + 1)}-${pad2(last.getDate())}` };
}

function calendarDayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function friendlyToday() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

async function fetchEntries(from: string, to: string) {
  const { data } = await api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
    params: { from, to },
  });
  return data.entries;
}

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

const palette = ADMIN_PALETTE;

export function CoordinatorDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";
  const now = new Date();
  const { from, to } = monthRangeIso(now.getFullYear(), now.getMonth());
  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

  const { data: entries = [], isLoading: loadingCal } = useQuery({
    queryKey: ["production-calendar-entries", from, to],
    queryFn: () => fetchEntries(from, to),
    staleTime: 60_000,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    staleTime: 60_000,
  });

  const summary = useMemo(() => {
    const open = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const delayed = open.filter((t) => t.status === TaskStatus.DELAYED).length;
    const unassigned = open.filter((t) => !(t.assignedToId ?? t.assignedTo?.id)).length;
    const pendingPipeline = entries.filter((e) => !e.eventId).length;
    const upcomingShoots = entries.filter((e) => calendarDayKeyFromIso(e.day) >= todayKey).length;
    const completedShootsMonth = entries.filter((e) => calendarDayKeyFromIso(e.day) < todayKey).length;
    const urgent = [...open].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 6);

    return {
      delayed,
      unassigned,
      pendingPipeline,
      upcomingShoots,
      completedShootsMonth,
      urgent,
      totalOpen: open.length,
    };
  }, [entries, tasks, todayKey]);

  const workload = useMemo(() => {
    const open = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const map = new Map<string, number>();
    for (const t of open) map.set(t.assignedTeam, (map.get(t.assignedTeam) ?? 0) + 1);
    const arr = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const max = arr[0]?.[1] ?? 1;
    return { rows: arr, max };
  }, [tasks]);

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminHero>
        <p className="admin-kicker">
          {greeting()}, {firstName}
        </p>
        <h1 className="admin-display-hero mt-4 max-w-5xl">Orchestrate shoots. Ignite editing lanes.</h1>
        <p className="admin-display-subtitle mt-4 text-base lg:text-lg">
          Bridge logistics into deadlines — unlock post-production when you&apos;re ready · {friendlyToday()}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="admin-btn admin-btn--solid" onClick={() => navigate("/coordinator/assignments")}>
            Open assignments
          </button>
          <button type="button" className="admin-btn" onClick={() => navigate("/coordinator/shoot-calendar")}>
            Shoot calendar
          </button>
        </div>
      </AdminHero>

      <section>
        <AdminSectionLabel>Quick access</AdminSectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <AdminHomeShortcut label="Command center" index="01" onClick={() => navigate("/coordinator")} />
          <AdminHomeShortcut label="Shoot calendar" index="02" onClick={() => navigate("/coordinator/shoot-calendar")} />
          <AdminHomeShortcut label="Assignments" index="03" onClick={() => navigate("/coordinator/assignments")} />
        </div>
      </section>

      <section>
        <AdminSectionLabel>Runway pulse</AdminSectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Pending pipeline" value={loadingCal ? "—" : summary.pendingPipeline} />
          <AdminStatCard label="Open deliverables" value={loadingTasks ? "—" : summary.totalOpen} />
          <AdminStatCard label="Upcoming shoots" value={loadingCal ? "—" : summary.upcomingShoots} />
          <AdminStatCard label="At-risk rows" value={loadingTasks ? "—" : summary.delayed} />
        </div>
        <p className="admin-display-subtitle mt-3 text-sm">
          {summary.unassigned} unassigned · {summary.completedShootsMonth} past days this month
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <AdminSurface>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="admin-display-title text-xl">Hot runway</h2>
              <p className="admin-display-subtitle mt-1 text-sm">Tightest delivery windows across crews.</p>
            </div>
            <Link to="/coordinator/assignments" className="admin-btn admin-btn--solid">
              Assignment board
            </Link>
          </div>
          <ul className="space-y-3">
            {summary.urgent.map((t) => (
              <li key={t.id} className="rounded-xl border-2 border-black px-4 py-3" style={{ backgroundColor: palette.surface }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: palette.text }}>
                      {t.event?.clientName ?? "Wedding"}
                    </p>
                    <p className="mt-0.5 text-sm" style={{ color: palette.textSecondary }}>
                      {taskTypeLabel(t.taskType)}
                      {t.assignedTo?.name ? ` · ${t.assignedTo.name}` : " · Unassigned"}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide" style={{ color: palette.textSecondary }}>
                  Due {new Date(t.deadline).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
              </li>
            ))}
            {!loadingTasks && summary.urgent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/30 py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
                Queue quiet — unlock the next wave from the shoot calendar.
              </div>
            ) : null}
          </ul>
        </AdminSurface>

        <div className="space-y-4">
          <AdminSurface>
            <h3 className="admin-display-title text-lg">Shoot footprint</h3>
            <p className="admin-display-subtitle mt-1 text-sm">This month’s logistics density.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-black p-4" style={{ backgroundColor: palette.surface }}>
                <p className="admin-kicker">Past days</p>
                <p className="admin-stat-value mt-2 text-2xl">{summary.completedShootsMonth}</p>
              </div>
              <div className="rounded-xl border-2 border-black p-4" style={{ backgroundColor: palette.surface }}>
                <p className="admin-kicker">Future days</p>
                <p className="admin-stat-value mt-2 text-2xl">{summary.upcomingShoots}</p>
              </div>
            </div>
            <button type="button" className="admin-btn mt-5 w-full" onClick={() => navigate("/coordinator/shoot-calendar")}>
              Enter calendar
            </button>
          </AdminSurface>

          <AdminSurface>
            <h3 className="admin-display-title text-lg">Open workload</h3>
            <p className="admin-display-subtitle mt-1 text-sm">Open deliverables by crew.</p>
            <div className="mt-5 space-y-4">
              {workload.rows.map(([team, count]) => {
                const pct = Math.max(8, Math.round((count / workload.max) * 100));
                return (
                  <div key={team}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium capitalize" style={{ color: palette.text }}>
                        {team.replaceAll("_", " ").toLowerCase()}
                      </span>
                      <span style={{ color: palette.textSecondary }}>{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-black/20 bg-white">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: palette.accent }} />
                    </div>
                  </div>
                );
              })}
              {workload.rows.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: palette.textSecondary }}>
                  No workload slices yet.
                </p>
              ) : null}
            </div>
          </AdminSurface>
        </div>
      </div>
    </div>
  );
}
