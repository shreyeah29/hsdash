import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Event, Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/PriorityBadge";

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

    return { dueToday, overdue, completed, pending, weddings: (data?.events ?? []).length };
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">At-a-glance deadlines, workload, and priority queue.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardDescription>Active Weddings</CardDescription>
            <CardTitle>{isLoading ? "—" : stats.weddings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Due Today</CardDescription>
            <CardTitle>{isLoading ? "—" : stats.dueToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue</CardDescription>
            <CardTitle>{isLoading ? "—" : stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle>{isLoading ? "—" : stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending</CardDescription>
            <CardTitle>{isLoading ? "—" : stats.pending}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Priority Queue</CardTitle>
            <CardDescription>Most urgent tasks across all teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorityQueue.map((t) => (
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
              {priorityQueue.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks yet.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
            <CardDescription>Open tasks per team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workload.map(([team, count]) => (
                <div key={team} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm font-medium">{team.replaceAll("_", " ")}</div>
                  <div className="text-sm text-muted-foreground">{count}</div>
                </div>
              ))}
              {workload.length === 0 ? (
                <div className="text-sm text-muted-foreground">No workload data yet.</div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

