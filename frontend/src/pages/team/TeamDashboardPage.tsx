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
import { cn } from "@/lib/utils";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function TeamDashboardPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

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

  const { data } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>("/tasks");
      return data.tasks;
    },
  });

  const now = new Date();
  const hour = now.getHours();

  const stats = useMemo(() => {
    const tasks = data ?? [];
    const open = tasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const overdue = open.filter((t) => new Date(t.deadline).getTime() < now.getTime()).length;
    const dueThisWeek = open.filter((t) => {
      const d = new Date(t.deadline);
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const urgent = open.filter((t) => {
      const d = new Date(t.deadline);
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }).length;
    const cinematic = open.filter((t) => t.taskType.includes("CINEMATIC")).length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { overdue, dueThisWeek, urgent, cinematic, progress, total: tasks.length, open: open.length };
  }, [data, now]);

  const nextUp = useMemo(() => {
    const tasks = (data ?? []).filter((t) => t.status !== TaskStatus.COMPLETED);
    return [...tasks].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 6);
  }, [data]);

  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-medium text-muted-foreground">
          {greeting(hour)}, {firstName}{" "}
          <span aria-hidden className="inline-block animate-pulse">
            👋
          </span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Stay in flow — your desk is clear of noise.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          You have{" "}
          <span className="font-semibold text-foreground">{stats.open}</span> active edits
          {stats.cinematic > 0 ? (
            <>
              , including <span className="font-semibold text-foreground">{stats.cinematic}</span> cinematic cuts still cooking
            </>
          ) : null}
          .{" "}
          {stats.urgent > 0 ? (
            <>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{stats.urgent}</span> need attention in the next day.
            </>
          ) : (
            <>Nothing screaming urgent — keep pacing toward your deadlines.</>
          )}{" "}
          <span className="font-semibold text-foreground">{stats.dueThisWeek}</span> due within seven days.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live assignments
              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-normal text-primary-foreground">{unreadCount}</span>
              ) : null}
            </CardTitle>
            <CardDescription>Fresh briefs from Emmanuel land here — deadlines stay synced with My Tasks.</CardDescription>
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
                  <Link to="/team/tasks">Open My Tasks</Link>
                </Button>
              </div>
            </div>
          ))}
          {notifications.length === 0 ? <p className="text-sm text-muted-foreground">No assignment pings yet — check back after the next drop.</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Urgent window</CardDescription>
            <CardTitle>{stats.urgent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Due this week</CardDescription>
            <CardTitle>{stats.dueThisWeek}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue</CardDescription>
            <CardTitle className={stats.overdue > 0 ? "text-destructive" : undefined}>{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completion</CardDescription>
            <CardTitle>{stats.progress}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Next countdowns</CardTitle>
            <CardDescription>Closest deadlines on your plate</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/team/tasks">Manage statuses</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nextUp.map((t) => {
              const due = new Date(t.deadline);
              const ms = due.getTime() - now.getTime();
              const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
              const countdown =
                days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : days === 1 ? "1 day left" : `${days} days`;
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/20 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.event?.clientName ?? "-"}</div>
                    <div className="truncate text-xs text-muted-foreground">{t.taskType.replaceAll("_", " ")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={t.priority} />
                    <div className="text-right text-xs">
                      <div className="font-medium tabular-nums">{countdown}</div>
                      <div className="text-muted-foreground">{due.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.total === 0 ? <div className="text-sm text-muted-foreground">No tasks yet — your queue is ready when Emmanuel assigns work.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
