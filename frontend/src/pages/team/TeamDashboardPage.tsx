import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { Task, UserNotification } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import { isProductionCoordinatorUser } from "@/lib/productionCoordinator";
import { cn } from "@/lib/utils";

export function TeamDashboardPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isCoordinator = isProductionCoordinatorUser(user?.email);

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const { data } = await api.get<{ notifications: UserNotification[] }>("/notifications");
      return data.notifications;
    },
  });

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  const { data: coordinatorTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>("/tasks");
      return data.tasks;
    },
    enabled: isCoordinator,
  });

  const coordinationSummary = useMemo(() => {
    const tasks = coordinatorTasks ?? [];
    const open = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const unassigned = open.filter((t) => !(t.assignedToId ?? t.assignedTo?.id)).length;
    return { open: open.length, unassigned };
  }, [coordinatorTasks]);

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

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-normal text-primary-foreground">{unreadCount}</span>
              ) : null}
            </CardTitle>
            <CardDescription>When you&apos;re assigned work, it appears here with the deadline — details are on My Tasks.</CardDescription>
          </div>
          {unreadCount > 0 ? (
            <Button type="button" variant="outline" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
              Mark all read
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.slice(0, 12).map((n) => (
            <div
              key={n.id}
              className={cn("rounded-md border p-3 text-sm", !n.read && "border-primary/35 bg-primary/5")}
            >
              <div className="font-medium">{n.title}</div>
              <div className="text-muted-foreground">{n.body}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {!n.read ? (
                  <Button type="button" variant="outline" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                    Mark read
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                  <Link to="/team/tasks">My Tasks</Link>
                </Button>
              </div>
            </div>
          ))}
          {notifications.length === 0 ? <p className="text-sm text-muted-foreground">No assignment notifications yet.</p> : null}
        </CardContent>
      </Card>

      {isCoordinator ? (
        <Card className="border-primary/35 bg-primary/5">
          <CardHeader>
            <CardTitle>Assign deliverables to team editors</CardTitle>
            <CardDescription>
              Choose who on each crew (Photo, Cinematic, Traditional, Album) owns each task. They&apos;ll see assignments under My Tasks with deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{coordinationSummary.open}</span> open deliverables ·{" "}
              <span className="font-medium text-foreground">{coordinationSummary.unassigned}</span> still unassigned
            </div>
            <Button asChild>
              <Link to="/team/assign-deliverables">Open assignment board</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

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

