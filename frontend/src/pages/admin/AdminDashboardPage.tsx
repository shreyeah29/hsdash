import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, CalendarClock, AlertTriangle, CircleCheck, Hourglass } from "lucide-react";
import { AdminOverviewHero } from "@/components/admin/AdminOverviewHero";
import { CreateDeliverableTasksDialog } from "@/components/admin/CreateDeliverableTasksDialog";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import {
  GlassPanel,
  AnimatedStatCard,
  PriorityShowcaseCard,
  WorkloadBar,
} from "@/components/premium";

async function fetchAdminData() {
  const now = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const from = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-01`;
  const to = `${now.getFullYear()}-${pad2(now.getMonth() + 2)}-${pad2(0)}`; // last day of current month

  const [countRes, tasksRes, calRes] = await Promise.all([
    api.get<{ count: number }>("/events/count"),
    api.get<{ tasks: Task[] }>("/tasks"),
    api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
      params: { from, to, summary: "1" },
    }),
  ]);
  return { weddingCount: countRes.data.count, tasks: tasksRes.data.tasks, entries: calRes.data.entries };
}

export function AdminDashboardPage() {
  const [createTasksOpen, setCreateTasksOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminData,
  });

  const stats = useMemo(() => {
    const now = new Date();
    const tasks = data?.tasks ?? [];
    const dueToday = tasks.filter((t) => new Date(t.deadline).toDateString() === now.toDateString()).length;
    const overdue = tasks.filter((t) => new Date(t.deadline).getTime() < now.getTime() && t.status !== TaskStatus.COMPLETED)
      .length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pending = tasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const total = tasks.length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { dueToday, overdue, completed, pending, weddings: data?.weddingCount ?? 0, completionRate, total };
  }, [data]);

  const upcomingShoots = useMemo(() => {
    const entries = data?.entries ?? [];
    const today = new Date();
    const upcoming = entries.filter((e) => new Date(e.day).getTime() >= new Date(today.toDateString()).getTime());

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

    return upcoming
      .map((e) => ({ entry: e, ...progress(e) }))
      .sort((a, b) => +new Date(a.entry.day) - +new Date(b.entry.day))
      .slice(0, 8);
  }, [data]);

  const priorityQueue = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
    return [...tasks]
      .sort((a, b) => order[a.priority] - order[b.priority] || +new Date(a.deadline) - +new Date(b.deadline))
      .slice(0, 8);
  }, [data]);

  const workload = useMemo(() => {
    const tasks = (data?.tasks ?? []).filter((t) => t.status !== TaskStatus.COMPLETED);
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.assignedTeam, (map.get(t.assignedTeam) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const workloadMax = workload[0]?.[1] ?? 1;
  const openTasks = stats.total - stats.completed;
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-10">
      <AdminOverviewHero
        monthLabel={monthLabel}
        isLoading={isLoading}
        weddings={stats.weddings}
        dueToday={stats.dueToday}
        overdue={stats.overdue}
        open={openTasks}
        completionRate={stats.completionRate}
        completed={stats.completed}
        total={stats.total}
        onCreateTasks={() => setCreateTasksOpen(true)}
      />

      <CreateDeliverableTasksDialog open={createTasksOpen} onOpenChange={setCreateTasksOpen} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AnimatedStatCard
          label="Active weddings"
          value={isLoading ? "—" : stats.weddings}
          hint="Weddings in system"
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

      <GlassPanel shine className="p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Upcoming shoots · logistics & progress</h2>
            <p className="mt-1 text-sm text-zinc-600">
              When editors update deliverables, this view refreshes automatically.
            </p>
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
                  <div className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
                    <div className="truncate">Team (photo): {entry.photoTeam || "—"}</div>
                    <div className="truncate">Team (video): {entry.videoTeam || "—"}</div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Deliverables</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {total > 0 ? (
                      <>
                        {done}/{total} done
                      </>
                    ) : (
                      "Not activated"
                    )}
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {nextDue ? `Next due: ${new Date(nextDue).toLocaleDateString()}` : total > 0 ? "All delivered" : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {upcomingShoots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-600">
              No upcoming shoots in this range yet.
            </div>
          ) : null}
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <GlassPanel shine className="p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Top priorities</h2>
              <p className="mt-1 text-sm text-zinc-600">By urgency and deadline.</p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
              Showing {priorityQueue.length}
            </span>
          </div>
          <div className="space-y-3">
            {priorityQueue.map((t, i) => (
              <PriorityShowcaseCard key={t.id} task={t} index={i} />
            ))}
            {!isLoading && priorityQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center text-sm text-zinc-600">
                Nothing in flight yet —{" "}
                <button type="button" className="font-medium text-violet-700 underline" onClick={() => setCreateTasksOpen(true)}>
                  create deliverable tasks
                </button>{" "}
                or{" "}
                <Link to="/admin/production-calendar" className="font-medium text-violet-700 underline">
                  open the shoot calendar
                </Link>
                .
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
