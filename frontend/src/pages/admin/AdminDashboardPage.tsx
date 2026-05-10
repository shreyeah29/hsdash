import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Heart, CalendarClock, AlertTriangle, CircleCheck, Hourglass, Sparkles } from "lucide-react";
import { api } from "@/services/api";
import type { Event, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import {
  GlassPanel,
  AnimatedStatCard,
  ProgressRing,
  PriorityShowcaseCard,
  WorkloadBar,
} from "@/components/premium";

async function fetchAdminData() {
  const [eventsRes, tasksRes] = await Promise.all([
    api.get<{ events: Array<Event & { tasks: Task[] }> }>("/events"),
    api.get<{ tasks: Task[] }>("/tasks"),
  ]);
  return { events: eventsRes.data.events, tasks: tasksRes.data.tasks };
}

export function AdminDashboardPage() {
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

    return { dueToday, overdue, completed, pending, weddings: (data?.events ?? []).length, completionRate, total };
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

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-2xl space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Wedding production OS
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            Mission control for every celebration you&apos;re crafting.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 md:text-base">
            Live snapshot of commitments, risk, and throughput — tuned for calm mornings and decisive afternoons.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <ProgressRing value={isLoading ? 0 : stats.completionRate} size={92} stroke={7} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Delivery health</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{isLoading ? "—" : `${stats.completionRate}%`}</p>
            <p className="text-xs text-zinc-500">
              {stats.completed} sealed · {stats.total - stats.completed} in motion
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AnimatedStatCard
          label="Active weddings"
          value={isLoading ? "—" : stats.weddings}
          hint="Events on record"
          icon={Heart}
          accent="violet"
          delay={0}
        />
        <AnimatedStatCard
          label="Due today"
          value={isLoading ? "—" : stats.dueToday}
          hint="Calendar-critical handoffs"
          icon={CalendarClock}
          accent="cyan"
          delay={0.05}
        />
        <AnimatedStatCard
          label="Overdue"
          value={isLoading ? "—" : stats.overdue}
          hint="Needs coordinator heat"
          icon={AlertTriangle}
          accent="rose"
          delay={0.1}
        />
        <AnimatedStatCard
          label="Completed"
          value={isLoading ? "—" : stats.completed}
          hint="Momentum vault"
          icon={CircleCheck}
          accent="emerald"
          delay={0.15}
        />
        <AnimatedStatCard
          label="Pending kickoff"
          value={isLoading ? "—" : stats.pending}
          hint="Awaiting movement"
          icon={Hourglass}
          accent="amber"
          delay={0.2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <GlassPanel shine className="p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Priority runway</h2>
              <p className="mt-1 text-sm text-zinc-500">Highest leverage deliverables across every crew.</p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
              Live queue · top {priorityQueue.length}
            </span>
          </div>
          <div className="space-y-3">
            {priorityQueue.map((t, i) => (
              <PriorityShowcaseCard key={t.id} task={t} index={i} />
            ))}
            {!isLoading && priorityQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center text-sm text-zinc-500">
                Nothing in flight yet — add shoots from the calendar to ignite the pipeline.
              </div>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className="flex flex-col p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-zinc-900">Team workload</h2>
            <p className="mt-1 text-sm text-zinc-500">Open tasks per crew — where attention compounds.</p>
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
              <p className="py-10 text-center text-sm text-zinc-500">Workload charts populate once tasks spin up.</p>
            ) : null}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
