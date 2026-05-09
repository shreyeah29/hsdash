import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/PriorityBadge";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localDayKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function TeamDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const scheduleRange = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 21);
    return { from: localDayKeyFromDate(today), to: localDayKeyFromDate(end) };
  }, []);

  const { data: scheduleEntries } = useQuery({
    queryKey: ["team-shoot-schedule", scheduleRange.from, scheduleRange.to],
    queryFn: async () => {
      const { data } = await api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
        params: scheduleRange,
      });
      return data.entries;
    },
  });

  const { data } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>("/tasks");
      return data.tasks;
    },
  });

  const now = new Date();
  const stats = useMemo(() => {
    const tasks = data ?? [];
    const open = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const overdue = open.filter((t) => new Date(t.deadline).getTime() < now.getTime()).length;
    const dueToday = open.filter((t) => new Date(t.deadline).toDateString() === now.toDateString()).length;
    const urgent = open.filter((t) => {
      const d = new Date(t.deadline);
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { overdue, dueToday, urgent, progress, total: tasks.length };
  }, [data, now]);

  const nextUp = useMemo(() => {
    const tasks = (data ?? []).filter((t) => t.status !== TaskStatus.COMPLETED);
    return [...tasks].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 6);
  }, [data]);

  const scheduleSorted = useMemo(() => {
    const rows = scheduleEntries ?? [];
    return [...rows].sort((a, b) => +new Date(a.day) - +new Date(b.day) || a.clientName.localeCompare(b.clientName));
  }, [scheduleEntries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
        <p className="text-sm text-muted-foreground">
          {user?.team ? `${user.team.replaceAll("_", " ")}` : "Team"} dashboard
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Urgent (≤1 day)</CardDescription>
            <CardTitle>{stats.urgent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Due Today</CardDescription>
            <CardTitle>{stats.dueToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue</CardDescription>
            <CardTitle>{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completion Progress</CardDescription>
            <CardTitle>{stats.progress}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shoot schedule</CardTitle>
          <CardDescription>What&apos;s on-site next (from production calendar — visible to whole team)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleSorted.slice(0, 12).map((e) => (
              <div key={e.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{e.clientName}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.day).toLocaleDateString()}</span>
                </div>
                {e.eventName ? <div className="text-muted-foreground">{e.eventName}</div> : null}
                {(e.startTime || e.endTime) && (
                  <div className="text-xs text-muted-foreground">
                    {e.startTime || "—"} – {e.endTime || "—"}
                  </div>
                )}
                {e.photoTeam ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs">
                    <span className="font-medium text-foreground">Photo: </span>
                    {e.photoTeam}
                  </div>
                ) : null}
                {e.videoTeam ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs">
                    <span className="font-medium text-foreground">Video: </span>
                    {e.videoTeam}
                  </div>
                ) : null}
                {e.addons ? (
                  <div className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    <span className="font-medium">Add-ons: </span>
                    {e.addons}
                  </div>
                ) : null}
              </div>
            ))}
            {scheduleSorted.length === 0 ? (
              <div className="text-sm text-muted-foreground">No shoots logged in the next few weeks.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Up</CardTitle>
          <CardDescription>Closest deadlines for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nextUp.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.event?.clientName ?? "-"}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.taskType.replaceAll("_", " ")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={t.priority} />
                  <div className="text-xs text-muted-foreground">{new Date(t.deadline).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {stats.total === 0 ? <div className="text-sm text-muted-foreground">No tasks yet.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

