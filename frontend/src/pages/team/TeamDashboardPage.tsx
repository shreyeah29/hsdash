import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Task, UserNotification } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { AdminHero, AdminHomeShortcut, AdminSectionLabel, AdminSurface } from "@/components/admin/AdminSurface";
import { ADMIN_PALETTE } from "@/lib/adminTheme";
import { useAuthStore } from "@/store/auth";
import { taskTypeLabel } from "@/lib/calendarUtils";
import { StatusBadge } from "@/components/StatusBadge";
import { crewLiveQueryOptions } from "@/hooks/useCrewLiveData";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function friendlyToday() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

const palette = ADMIN_PALETTE;

export function TeamDashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";
  const now = new Date();

  const { data: notifications = [], dataUpdatedAt: notificationsUpdatedAt } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const { data } = await api.get<{ notifications: UserNotification[] }>("/notifications");
      return data.notifications;
    },
    ...crewLiveQueryOptions,
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

  const {
    data,
    refetch: refetchTasks,
    isFetching,
    isError: tasksError,
    error: tasksQueryError,
  } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>("/tasks");
      return data.tasks;
    },
    ...crewLiveQueryOptions,
  });

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
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { overdue, dueThisWeek, urgent, progress, total: tasks.length, open: open.length };
  }, [data, now]);

  const nextUp = useMemo(() => {
    const tasks = (data ?? []).filter((t) => t.status !== TaskStatus.COMPLETED);
    return [...tasks].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 6);
  }, [data]);

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminHero>
        <p className="admin-kicker">
          {greeting()}, {firstName}
        </p>
        <h1 className="admin-display-hero mt-4 max-w-5xl">
          {stats.open > 0 ? `${stats.open} cuts need your signature` : "Your edit bay is clear"}
        </h1>
        <p className="admin-display-subtitle mt-4 text-base lg:text-lg">
          {stats.urgent > 0 ? `${stats.urgent} due within 24h · ` : ""}
          {stats.dueThisWeek} due this week · {friendlyToday()}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="admin-btn admin-btn--solid" onClick={() => navigate("/team/tasks")}>
            Jump into tasks
          </button>
          <button
            type="button"
            className="admin-btn"
            disabled={isFetching}
            onClick={() => {
              void refetchTasks();
              void qc.invalidateQueries({ queryKey: ["my-notifications"] });
            }}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </AdminHero>

      <section>
        <AdminSectionLabel>Quick access</AdminSectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AdminHomeShortcut label="Today" index="01" onClick={() => navigate("/team")} />
          <AdminHomeShortcut label="My tasks" index="02" onClick={() => navigate("/team/tasks")} />
        </div>
      </section>

      {tasksError ? (
        <AdminSurface>
          <p className="admin-display-title text-xl">Could not load tasks</p>
          <p className="admin-display-subtitle mt-2 text-sm">{String((tasksQueryError as Error)?.message ?? "")}</p>
        </AdminSurface>
      ) : null}

      <section>
        <AdminSectionLabel>Your runway</AdminSectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminSurface padding="p-4 lg:p-5">
            <p className="admin-kicker">Urgent</p>
            <p className="admin-stat-value mt-2">{stats.urgent}</p>
            <p className="admin-display-subtitle mt-1 text-sm">≤ 24 hours</p>
          </AdminSurface>
          <AdminSurface padding="p-4 lg:p-5">
            <p className="admin-kicker">This week</p>
            <p className="admin-stat-value mt-2">{stats.dueThisWeek}</p>
            <p className="admin-display-subtitle mt-1 text-sm">Stay ahead</p>
          </AdminSurface>
          <AdminSurface padding="p-4 lg:p-5">
            <p className="admin-kicker">Overdue</p>
            <p className="admin-stat-value mt-2">{stats.overdue}</p>
            <p className="admin-display-subtitle mt-1 text-sm">Recover gracefully</p>
          </AdminSurface>
          <AdminSurface padding="p-4 lg:p-5">
            <p className="admin-kicker">Completion</p>
            <p className="admin-stat-value mt-2">{stats.progress}%</p>
            <p className="admin-display-subtitle mt-1 text-sm">Personal throughput</p>
          </AdminSurface>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <AdminSectionLabel>Signal inbox</AdminSectionLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="admin-btn"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              Clear unread ({unreadCount})
            </button>
          ) : null}
        </div>
        <p className="admin-display-subtitle mt-1 text-sm">
          Admin assignments appear here when you&apos;re assigned.
          {notificationsUpdatedAt ? (
            <span className="block text-[11px]">Last sync {new Date(notificationsUpdatedAt).toLocaleTimeString()}</span>
          ) : null}
        </p>
        <div className="mt-4 grid gap-3">
          {notifications.slice(0, 12).map((n) => (
            <AdminSurface key={n.id} padding="p-4 lg:p-5">
              <p className="text-lg font-semibold uppercase tracking-tight text-black">{n.title}</p>
              <p className="admin-display-subtitle mt-1 text-sm">{n.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!n.read ? (
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(n.id)}
                  >
                    Mark read
                  </button>
                ) : null}
                <Link to="/team/tasks" className="admin-btn" style={{ color: palette.accent }}>
                  Open tasks
                </Link>
              </div>
            </AdminSurface>
          ))}
          {notifications.length === 0 ? (
            <AdminSurface>
              <p className="admin-display-subtitle text-base">Quiet channel — new assignments appear here when they&apos;re yours.</p>
            </AdminSurface>
          ) : null}
        </div>
      </section>

      <section>
        <AdminSectionLabel>Incoming countdowns</AdminSectionLabel>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {nextUp.map((task) => (
            <AdminSurface key={task.id} padding="p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold uppercase tracking-tight text-black">
                    {task.event?.clientName ?? "Wedding"}
                  </p>
                  <p className="admin-display-subtitle mt-1 text-sm">{taskTypeLabel(task.taskType)}</p>
                  <p className="admin-kicker mt-2" style={{ color: palette.accent }}>
                    {new Date(task.deadline).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            </AdminSurface>
          ))}
          {stats.total === 0 ? (
            <AdminSurface>
              <p className="admin-display-subtitle text-base">No tasks assigned yet.</p>
            </AdminSurface>
          ) : null}
        </div>
      </section>
    </div>
  );
}
