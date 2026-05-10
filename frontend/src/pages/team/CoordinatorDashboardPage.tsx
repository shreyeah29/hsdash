import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/PriorityBadge";
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

    const urgent = [...open].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 5);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Operations command center</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Track shoots, unlock post-production when a wedding wraps, and keep editor assignments moving. Admins build the shoot calendar;
          you turn finished shoots into delivery tasks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-amber-400/25 bg-black/30 text-white shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-amber-100/80">Pending pipeline</CardDescription>
            <CardTitle className="text-3xl text-amber-50">{summary.pendingPipeline}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-white/65">Shoots logged without post-production tasks yet.</CardContent>
        </Card>
        <Card className="border-white/15 bg-black/25 text-white backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-white/65">Upcoming shoots (month)</CardDescription>
            <CardTitle className="text-3xl">{loadingCal ? "…" : summary.upcomingShoots}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-white/65">Days from today forward on this calendar view.</CardContent>
        </Card>
        <Card className="border-white/15 bg-black/25 text-white backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-white/65">Open deliverables</CardDescription>
            <CardTitle className="text-3xl">{loadingTasks ? "…" : summary.totalOpen}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-white/65">{summary.unassigned} waiting for an editor assignment.</CardContent>
        </Card>
        <Card className="border-rose-400/30 bg-black/30 text-white backdrop-blur-sm">
          <CardHeader>
            <CardDescription className="text-rose-100/80">Delayed / at risk</CardDescription>
            <CardTitle className="text-3xl text-rose-50">{summary.delayed}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-white/65">Tasks flagged past deadline or stalled.</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="border-white/15 bg-black/25 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-white">Hot deliveries</CardTitle>
              <CardDescription className="text-white/65">Closest deadlines across all crews</CardDescription>
            </div>
            <Button size="sm" variant="secondary" className="bg-amber-500 text-black hover:bg-amber-400" asChild>
              <Link to="/coordinator/assignments">Open assignment board</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.urgent.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/35 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.event?.clientName ?? "Client"}</div>
                  <div className="truncate text-xs text-white/60">{t.taskType.replaceAll("_", " ")}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-white/60">{new Date(t.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {!loadingTasks && summary.urgent.length === 0 ? (
              <p className="text-sm text-white/55">No open tasks — great moment to prep the next shoot week.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-black/25 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Shoot coverage</CardTitle>
            <CardDescription className="text-white/65">This month&apos;s logistics footprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
              <span className="text-white/70">Past shoot days</span>
              <span className="font-semibold">{summary.completedShootsMonth}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
              <span className="text-white/70">Future shoot days</span>
              <span className="font-semibold">{summary.upcomingShoots}</span>
            </div>
            <Button variant="outline" className="w-full border-white/25 text-white hover:bg-white/10" asChild>
              <Link to="/coordinator/shoot-calendar">Review shoot calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
