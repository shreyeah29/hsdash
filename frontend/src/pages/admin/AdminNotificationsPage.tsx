import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Activity, Heart, Radio, RefreshCw, Users } from "lucide-react";
import { api } from "@/services/api";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { BorderBeam } from "@/components/premium/BorderBeam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import type { Task, User } from "@/types/domain";
import {
  buildOpsDashboard,
  formatActivityWhen,
  healthColor,
  healthLabel,
  opsKindColor,
  opsKindLabel,
  type ActivityPeriodFilter,
  type ActivityTypeFilter,
  type TaskActivityRow,
} from "@/lib/activityFeedUtils";
import { cn } from "@/lib/utils";

async function fetchActivity() {
  const { data } = await api.get<{ activities: TaskActivityRow[] }>("/admin/task-activity", {
    params: { limit: 200 },
  });
  return data.activities;
}

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

function activityLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) {
      return "The API returned 404 for /admin/task-activity. Your backend deploy may be stale — redeploy from latest main with migrations applied.";
    }
    if (status === 401 || status === 403) {
      return "You are not authorized. Sign out and sign back in as admin.";
    }
    if (!error.response) {
      return "Network error — check VITE_API_URL and that the API is reachable.";
    }
    return `Request failed (${status ?? "?"}).`;
  }
  return "Could not load activity.";
}

const PERIODS: { value: ActivityPeriodFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

type TabKey = "feed" | "people" | "weddings";

export function AdminNotificationsPage() {
  const [tab, setTab] = useState<TabKey>("feed");
  const [period, setPeriod] = useState<ActivityPeriodFilter>("today");
  const [type, setType] = useState<ActivityTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");

  const activityQuery = useQuery({ queryKey: ["admin-task-activity"], queryFn: fetchActivity });
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
  const rosterQuery = useQuery({ queryKey: ["production-calendar-roster"], queryFn: fetchRoster });

  const isLoading = activityQuery.isLoading || tasksQuery.isLoading;
  const error = activityQuery.error;
  const isRefetching = activityQuery.isRefetching || tasksQuery.isRefetching;

  const dashboard = useMemo(() => {
    return buildOpsDashboard(activityQuery.data ?? [], tasksQuery.data ?? [], {
      period,
      type,
      search,
      eventId: eventId || null,
      memberId: memberId || null,
    }, rosterQuery.data ?? []);
  }, [activityQuery.data, tasksQuery.data, rosterQuery.data, period, type, search, eventId, memberId]);

  function refetchAll() {
    void activityQuery.refetch();
    void tasksQuery.refetch();
    void rosterQuery.refetch();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <Spotlight className="rounded-3xl border border-zinc-200/80" glowColor="rgba(34, 211, 238, 0.07)">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3 px-1 py-1 md:px-2 md:py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Team operations</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              <GradientShimmerText>Activity dashboard</GradientShimmerText>
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600">
              Feed, people pulse, and wedding-level motion — same ops view as the mobile admin tab.
            </p>
          </div>

          <GlassPanel className="flex flex-wrap items-center gap-3 p-4 shine">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              <Radio className="h-4 w-4 text-cyan-600" />
              <span>
                <span className="font-semibold text-zinc-900">{dashboard.timeline.length}</span> in view
              </span>
            </div>
            <Button type="button" variant="glass" size="sm" className="gap-2 rounded-xl" disabled={isRefetching} onClick={refetchAll}>
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </GlassPanel>
        </div>
      </Spotlight>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Active members", value: dashboard.overview.activeMembers },
          { label: "Assigned today", value: dashboard.overview.assignedToday },
          { label: "Started today", value: dashboard.overview.startedToday },
          { label: "Completed today", value: dashboard.overview.completedToday },
          { label: "Delayed tasks", value: dashboard.overview.delayedTasks },
          { label: "Idle members", value: dashboard.overview.idleMembers },
        ].map((m) => (
          <GlassPanel key={m.label} className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">{m.value}</div>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              type="button"
              size="sm"
              variant={period === p.value ? "premium" : "glass"}
              className="rounded-xl"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Search member, client, task…" />
          <Select value={type} onValueChange={(v) => setType(v as ActivityTypeFilter)}>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </Select>
          <Select value={eventId || "ALL"} onValueChange={(v) => setEventId(v === "ALL" ? "" : v)}>
            <SelectItem value="ALL">All events</SelectItem>
            {dashboard.eventOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </Select>
          <Select value={memberId || "ALL"} onValueChange={(v) => setMemberId(v === "ALL" ? "" : v)}>
            <SelectItem value="ALL">All members</SelectItem>
            {dashboard.memberOptions.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-100 pb-4">
          {(
            [
              { key: "feed", label: "Feed", icon: Activity },
              { key: "people", label: "People", icon: Users },
              { key: "weddings", label: "Weddings", icon: Heart },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={tab === key ? "premium" : "ghost"}
              className="gap-2 rounded-xl"
              onClick={() => setTab(key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {activityLoadErrorMessage(error)}
          </div>
        ) : null}

        {isLoading ? <p className="py-12 text-center text-sm text-zinc-600">Loading team operations…</p> : null}

        {!isLoading && tab === "feed" ? (
          dashboard.timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-zinc-900">Quiet channel</p>
              <p className="mt-2 text-sm text-zinc-600">No activity matches your filters for this period.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {dashboard.timeline.map((e) => (
                <li key={e.id}>
                  <BorderBeam>
                    <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500">{formatActivityWhen(e.timestamp)}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", opsKindColor(e.kind))}>
                          {opsKindLabel(e.kind)}
                        </span>
                        {e.synthetic ? (
                          <span className="text-[10px] uppercase tracking-wide text-zinc-400">Synthetic</span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">{e.memberName}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {e.eventName ?? "Unknown client"} — {e.taskName}
                      </p>
                    </div>
                  </BorderBeam>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {!isLoading && tab === "people" ? (
          dashboard.members.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-600">No team members match these filters.</p>
          ) : (
            <ul className="space-y-3">
              {dashboard.members.map((m) => (
                <li key={m.memberId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-900">{m.memberName}</div>
                      <div className="text-xs text-zinc-500">{m.roleLabel}</div>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", healthColor(m.health))}>
                      {healthLabel(m.health)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                    <span>{m.openTasks} open</span>
                    <span>{m.startedInPeriod} started</span>
                    <span>{m.completedInPeriod} completed</span>
                    {m.lastActivity ? <span>Last active {formatActivityWhen(m.lastActivity)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {!isLoading && tab === "weddings" ? (
          dashboard.events.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-600">No wedding activity for this period.</p>
          ) : (
            <ul className="space-y-3">
              {dashboard.events.map((ev) => (
                <li key={ev.eventId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <div className="font-semibold text-zinc-900">{ev.eventName}</div>
                  <div className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
                    {ev.startedMembers.length ? (
                      <div>
                        <span className="font-medium text-zinc-800">Started:</span> {ev.startedMembers.join(", ")}
                      </div>
                    ) : null}
                    {ev.completedMembers.length ? (
                      <div>
                        <span className="font-medium text-zinc-800">Completed:</span> {ev.completedMembers.join(", ")}
                      </div>
                    ) : null}
                    {ev.delayedMembers.length ? (
                      <div>
                        <span className="font-medium text-rose-700">Delayed:</span> {ev.delayedMembers.join(", ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">{ev.entries.length} activity entries</div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </GlassPanel>
    </motion.div>
  );
}
