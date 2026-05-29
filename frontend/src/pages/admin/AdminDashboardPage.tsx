import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { Heart, CalendarClock, AlertTriangle, CircleCheck, Hourglass } from "lucide-react";
import { AdminOverviewHero } from "@/components/admin/AdminOverviewHero";
import { WeddingPriorityPanel } from "@/components/admin/WeddingPriorityPanel";
import { CreateDeliverableTasksDialog } from "@/components/admin/CreateDeliverableTasksDialog";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import {
  GlassPanel,
  AnimatedStatCard,
  WorkloadBar,
} from "@/components/premium";

type AdminOverviewResponse = {
  stats: {
    weddings: number;
    eventCount: number;
    shootCount: number;
    dueToday: number;
    overdue: number;
    completed: number;
    pending: number;
    total: number;
    open: number;
    completionRate: number;
  };
  tasks: Task[];
  entries: ShootCalendarEntry[];
};

async function fetchAdminData() {
  const { data } = await api.get<AdminOverviewResponse>("/admin/overview");
  return data;
}

function overviewLoadError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return "Overview API not found — redeploy the backend on Render, then refresh.";
    }
    if (!error.response) {
      return "Could not reach the API — check VITE_API_URL on Vercel.";
    }
    const msg = (error.response.data as { message?: string })?.message;
    if (typeof msg === "string") return msg;
  }
  return "Could not load dashboard data. Try refreshing.";
}

export function AdminDashboardPage() {
  const [createTasksOpen, setCreateTasksOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminData,
    refetchOnWindowFocus: true,
  });

  const stats = useMemo(() => {
    const s = data?.stats;
    return {
      dueToday: s?.dueToday ?? 0,
      overdue: s?.overdue ?? 0,
      completed: s?.completed ?? 0,
      pending: s?.pending ?? 0,
      weddings: s?.weddings ?? 0,
      completionRate: s?.completionRate ?? 0,
      total: s?.total ?? 0,
      open: s?.open ?? 0,
      eventCount: s?.eventCount ?? 0,
      shootCount: s?.shootCount ?? 0,
    };
  }, [data]);

  const upcomingShoots = useMemo(() => {
    const entries = data?.entries ?? [];

    function progress(e: ShootCalendarEntry) {
      const tasks = e.event?.tasks ?? [];
      const total = tasks.length;
      const done = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      const nextDue =
        [...tasks]
          .filter((t) => t.status !== TaskStatus.COMPLETED)
          .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))[0]?.deadline ?? null;
      return { total, done, nextDue };
    }

    return entries
      .map((e) => ({ entry: e, ...progress(e) }))
      .sort((a, b) => +new Date(a.entry.day) - +new Date(b.entry.day))
      .slice(0, 8);
  }, [data]);

  const workload = useMemo(() => {
    const tasks = (data?.tasks ?? []).filter((t) => t.status !== TaskStatus.COMPLETED);
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.assignedTeam, (map.get(t.assignedTeam) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const workloadMax = workload[0]?.[1] ?? 1;
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const allTasks = data?.tasks ?? [];

  return (
    <div className="space-y-10">
      {isError ? (
        <GlassPanel className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {overviewLoadError(error)}{" "}
          <button type="button" className="font-semibold underline" onClick={() => void refetch()}>
            Retry
          </button>
        </GlassPanel>
      ) : null}

      <AdminOverviewHero
        monthLabel={monthLabel}
        isLoading={isLoading}
        weddings={stats.weddings}
        dueToday={stats.dueToday}
        overdue={stats.overdue}
        open={stats.open}
        completionRate={stats.completionRate}
        completed={stats.completed}
        total={stats.total}
        onCreateTasks={() => setCreateTasksOpen(true)}
      />

      {!isLoading && !isError && stats.eventCount === 0 && stats.shootCount > 0 ? (
        <p className="text-sm text-violet-800">
          {stats.shootCount} shoot{stats.shootCount === 1 ? "" : "s"} on the calendar — activate deliverable tasks to
          track completion here.
        </p>
      ) : null}

      <CreateDeliverableTasksDialog open={createTasksOpen} onOpenChange={setCreateTasksOpen} />

      {isFetching && !isLoading ? (
        <p className="text-center text-xs text-zinc-500">Refreshing numbers…</p>
      ) : null}

      <WeddingPriorityPanel tasks={allTasks} isLoading={isLoading} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AnimatedStatCard
          label="Active weddings"
          value={isLoading ? "—" : stats.weddings}
          hint={stats.eventCount > 0 ? "With deliverables" : stats.shootCount > 0 ? "Shoots logged" : "None yet"}
          icon={Heart}
          accent="violet"
          delay={0}
        />
        <AnimatedStatCard
          label="Due today"
          value={isLoading ? "—" : stats.dueToday}
          hint="Deadlines today"
          icon={CalendarClock}
          accent="cyan"
          delay={0.05}
        />
        <AnimatedStatCard
          label="Overdue"
          value={isLoading ? "—" : stats.overdue}
          hint="Past deadline"
          icon={AlertTriangle}
          accent="rose"
          delay={0.1}
        />
        <AnimatedStatCard
          label="Completed"
          value={isLoading ? "—" : stats.completed}
          hint="Marked complete"
          icon={CircleCheck}
          accent="emerald"
          delay={0.15}
        />
        <AnimatedStatCard
          label="Pending kickoff"
          value={isLoading ? "—" : stats.pending}
          hint="Not started yet"
          icon={Hourglass}
          accent="amber"
          delay={0.2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassPanel shine className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Upcoming shoots</h2>
              <p className="mt-1 text-sm text-zinc-600">Logistics on the calendar.</p>
            </div>
            <Button variant="glass" className="rounded-xl" asChild>
              <Link to="/admin/production-calendar">Open calendar</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingShoots.map(({ entry, total, done, nextDue }) => (
              <div key={entry.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900">{entry.clientName}</div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {new Date(entry.day).toLocaleDateString()} · {entry.venue || "Venue —"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-zinc-600">
                    {total > 0 ? `${done}/${total} done` : "Not activated"}
                    {nextDue ? ` · Next ${new Date(nextDue).toLocaleDateString()}` : ""}
                  </div>
                </div>
              </div>
            ))}
            {upcomingShoots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-600">
                No upcoming shoots in this range.
              </div>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-col p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">Open tasks by team</h2>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-6">
            {workload.map(([team, count], i) => (
              <WorkloadBar
                key={team}
                label={team.replaceAll("_", " ")}
                value={count}
                max={workloadMax}
                tone={i % 3 === 0 ? "violet" : i % 3 === 1 ? "cyan" : "amber"}
              />
            ))}
            {!isLoading && workload.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-600">No open tasks yet.</p>
            ) : null}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
