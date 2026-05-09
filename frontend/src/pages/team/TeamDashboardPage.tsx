import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/PriorityBadge";

export function TeamDashboardPage() {
  const user = useAuthStore((s) => s.user);
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

