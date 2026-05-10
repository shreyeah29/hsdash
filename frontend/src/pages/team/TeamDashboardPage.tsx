import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, CalendarHeart, AlertOctagon, Sparkles } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import type { Task, UserNotification } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel, AnimatedStatCard, PriorityShowcaseCard } from "@/components/premium";
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
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel shine-border relative overflow-hidden p-8 md:p-10"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="relative space-y-4">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200/90">
            <span className="text-lg">👋</span>
            {greeting(hour)}, {firstName}
          </p>
          <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white md:text-[2.1rem]">
            Your edit bay is tuned —{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              {stats.open > 0 ? `${stats.open} cuts need your signature.` : "fresh canvas awaiting Emmanuel's next drop."}
            </span>
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-[15px]">
            {stats.cinematic > 0 ? (
              <>
                <span className="font-semibold text-white">{stats.cinematic}</span> cinematic edits still simmering.{" "}
              </>
            ) : null}
            {stats.urgent > 0 ? (
              <>
                <span className="font-semibold text-amber-300">{stats.urgent}</span> ask for love within 24h.{" "}
              </>
            ) : (
              <>Cadence looks humane — protect deep focus time. </>
            )}
            <span className="font-semibold text-white">{stats.dueThisWeek}</span> deliveries horizon within seven days.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="premium" className="rounded-xl px-6" asChild>
              <Link to="/team/tasks">Jump into tasks</Link>
            </Button>
            <Button variant="glass" className="rounded-xl border-white/15" asChild>
              <Link to="/team/tasks">Update statuses</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedStatCard label="Urgent horizon" value={stats.urgent} hint="≤ 24 hours" icon={Zap} accent="amber" delay={0} />
        <AnimatedStatCard label="This week" value={stats.dueThisWeek} hint="Stay ahead" icon={CalendarHeart} accent="cyan" delay={0.05} />
        <AnimatedStatCard label="Overdue" value={stats.overdue} hint="Recover gracefully" icon={AlertOctagon} accent="rose" delay={0.1} />
        <AnimatedStatCard label="Completion" value={`${stats.progress}%`} hint="Personal throughput" icon={Sparkles} accent="emerald" delay={0.15} />
      </div>

      <GlassPanel shine className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Signal inbox</h2>
            <p className="text-sm text-zinc-500">Coordinator pings sync instantly — acknowledge when ready.</p>
          </div>
          {unreadCount > 0 ? (
            <Button variant="glass" size="sm" disabled={markAllRead.isPending} onClick={() => markAllRead.mutate()}>
              Clear unread ({unreadCount})
            </Button>
          ) : null}
        </div>
        <div className="mt-6 space-y-3">
          {notifications.slice(0, 12).map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors",
                !n.read && "border-emerald-400/25 bg-emerald-500/[0.07]",
              )}
            >
              <div className="font-medium text-white">{n.title}</div>
              <div className="mt-1 text-sm text-zinc-400">{n.body}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!n.read ? (
                  <Button variant="glass" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                    Mark read
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="text-emerald-300 hover:text-emerald-200" asChild>
                  <Link to="/team/tasks">Open tasks →</Link>
                </Button>
              </div>
            </div>
          ))}
          {notifications.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
              Quiet channel — new assignments appear here the moment they&apos;re yours.
            </p>
          ) : null}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Incoming countdowns</h2>
            <p className="text-sm text-zinc-500">Closest deadlines first — tap tasks for granular controls.</p>
          </div>
          <Button variant="premium" size="sm" className="rounded-xl" asChild>
            <Link to="/team/tasks">Expand workspace</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {nextUp.map((t, i) => (
            <PriorityShowcaseCard key={t.id} task={t} index={i} />
          ))}
          {stats.total === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
              Queue pristine — Emmanuel routes work here when shoots unlock.
            </div>
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}
