import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Radar,
  CalendarDays,
  ClipboardPenLine,
  Flame,
  Orbit,
} from "lucide-react";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel, AnimatedStatCard, PriorityShowcaseCard, WorkloadBar } from "@/components/premium";
import { Button } from "@/components/ui/button";

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

export function CoordinatorDashboardPage() {
  const now = new Date();
  const { from, to } = monthRangeIso(now.getFullYear(), now.getMonth());

  const { data: entries = [], isLoading: loadingCal } = useQuery({
    queryKey: ["production-calendar-entries", from, to],
    queryFn: () => fetchEntries(from, to),
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

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
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-900">
          <Orbit className="h-3.5 w-3.5 text-amber-700" />
          Coordinator runway
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          Orchestrate shoots. Ignite editing lanes.
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 md:text-[15px]">
          Bridge logistics into deadlines — unlock post-production when you&apos;re ready, route workload without friction.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedStatCard
          label="Pending pipeline"
          value={loadingCal ? "—" : summary.pendingPipeline}
          hint="Shoots awaiting kickoff"
          icon={Radar}
          accent="amber"
          delay={0}
        />
        <AnimatedStatCard
          label="Open deliverables"
          value={loadingTasks ? "—" : summary.totalOpen}
          hint={`${summary.unassigned} unassigned`}
          icon={ClipboardPenLine}
          accent="violet"
          delay={0.05}
        />
        <AnimatedStatCard
          label="Upcoming shoots"
          value={loadingCal ? "—" : summary.upcomingShoots}
          hint="This month ahead"
          icon={CalendarDays}
          accent="cyan"
          delay={0.1}
        />
        <AnimatedStatCard
          label="At-risk rows"
          value={loadingTasks ? "—" : summary.delayed}
          hint="Escalate lovingly"
          icon={Flame}
          accent="rose"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <GlassPanel shine className="p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Hot runway</h2>
              <p className="text-sm text-zinc-500">Tightest delivery windows across crews.</p>
            </div>
            <Button size="sm" variant="premium" className="rounded-xl px-5" asChild>
              <Link to="/coordinator/assignments">Open assignment board</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {summary.urgent.map((t, i) => (
              <PriorityShowcaseCard key={t.id} task={t} index={i} />
            ))}
            {!loadingTasks && summary.urgent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
                Queue quiet — prime the next assignment wave from calendar unlocks.
              </div>
            ) : null}
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel className="p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Shoot footprint · month view</h3>
            <p className="mt-1 text-xs text-zinc-500">Logistics density snapshot.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Past days</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.completedShootsMonth}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Future days</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.upcomingShoots}</p>
              </div>
            </div>
            <Button variant="glass" className="mt-5 w-full" asChild>
              <Link to="/coordinator/shoot-calendar">Enter premium calendar</Link>
            </Button>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Open workload · crews</h3>
            <div className="mt-5 space-y-5">
              {workload.rows.map(([team, count], i) => (
                <WorkloadBar
                  key={team}
                  label={team.replaceAll("_", " ")}
                  value={count}
                  max={workload.max}
                  tone={i % 3 === 0 ? "amber" : i % 3 === 1 ? "violet" : "cyan"}
                />
              ))}
              {workload.rows.length === 0 ? (
                <p className="text-center text-sm text-zinc-500">No workload slices yet.</p>
              ) : null}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
