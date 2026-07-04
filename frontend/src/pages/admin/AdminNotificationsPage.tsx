import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Activity, Heart, RefreshCw, Users } from "lucide-react";
import { api } from "@/services/api";
import { AdminInput, AdminSelect } from "@/components/admin/AdminFields";
import { AdminSurface } from "@/components/admin/AdminSurface";
import {
  AdminButton,
  AdminPageHeader,
  AdminStatCard,
  AdminTabButton,
  useAdminPalette,
} from "@/components/admin/AdminUi";
import type { Task, User } from "@/types/domain";
import type { AttendanceAlertRow } from "@/types/attendance";
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

async function fetchAttendanceAlerts() {
  const { data } = await api.get<{ alerts: AttendanceAlertRow[] }>("/admin/attendance-alerts", {
    params: { limit: 80 },
  });
  return data.alerts;
}

function activityLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) return "Activity API not found — redeploy backend from latest main.";
    if (status === 401 || status === 403) return "Not authorized — sign in as admin.";
    if (!error.response) return "Network error — check API URL.";
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
  const palette = useAdminPalette();
  const [tab, setTab] = useState<TabKey>("feed");
  const [period, setPeriod] = useState<ActivityPeriodFilter>("today");
  const [type, setType] = useState<ActivityTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");

  const activityQuery = useQuery({ queryKey: ["admin-task-activity"], queryFn: fetchActivity });
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
  const rosterQuery = useQuery({ queryKey: ["production-calendar-roster"], queryFn: fetchRoster });
  const attendanceQuery = useQuery({ queryKey: ["admin-attendance-alerts"], queryFn: fetchAttendanceAlerts });

  const isLoading = activityQuery.isLoading || tasksQuery.isLoading || attendanceQuery.isLoading;
  const error = activityQuery.error;
  const isRefetching = activityQuery.isRefetching || tasksQuery.isRefetching || attendanceQuery.isRefetching;

  const dashboard = useMemo(() => {
    return buildOpsDashboard(
      activityQuery.data ?? [],
      tasksQuery.data ?? [],
      { period, type, search, eventId: eventId || null, memberId: memberId || null },
      rosterQuery.data ?? [],
      attendanceQuery.data ?? [],
    );
  }, [activityQuery.data, tasksQuery.data, rosterQuery.data, attendanceQuery.data, period, type, search, eventId, memberId]);

  function refetchAll() {
    void activityQuery.refetch();
    void tasksQuery.refetch();
    void rosterQuery.refetch();
    void attendanceQuery.refetch();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        label="ACTIVITY"
        title="Team operations"
        subtitle="Feed, people pulse, and wedding-level motion — same as the mobile Activity tab."
        actions={
          <AdminButton variant="ghost" disabled={isRefetching} onClick={refetchAll}>
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            Refresh
          </AdminButton>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Active members", value: dashboard.overview.activeMembers },
          { label: "Assigned today", value: dashboard.overview.assignedToday },
          { label: "Started today", value: dashboard.overview.startedToday },
          { label: "Completed today", value: dashboard.overview.completedToday },
          { label: "Delayed tasks", value: dashboard.overview.delayedTasks },
          { label: "Idle members", value: dashboard.overview.idleMembers },
        ].map((m) => (
          <AdminStatCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <AdminSurface className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <AdminTabButton key={p.value} active={period === p.value} onClick={() => setPeriod(p.value)}>
              {p.label}
            </AdminTabButton>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <AdminInput value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Search member, client, task…" />
          <AdminSelect value={type} onChange={(e) => setType(e.target.value as ActivityTypeFilter)}>
            <option value="all">All types</option>
            <option value="assigned">Assigned</option>
            <option value="started">Started</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
            <option value="attendance">Attendance</option>
          </AdminSelect>
          <AdminSelect value={eventId || "ALL"} onChange={(e) => setEventId(e.target.value === "ALL" ? "" : e.target.value)}>
            <option value="ALL">All events</option>
            {dashboard.eventOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect value={memberId || "ALL"} onChange={(e) => setMemberId(e.target.value === "ALL" ? "" : e.target.value)}>
            <option value="ALL">All members</option>
            {dashboard.memberOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </AdminSelect>
        </div>

        <div className="flex flex-wrap gap-2 border-b pb-4" style={{ borderColor: palette.border }}>
          {(
            [
              { key: "feed" as const, label: "Feed", icon: Activity },
              { key: "people" as const, label: "People", icon: Users },
              { key: "weddings" as const, label: "Weddings", icon: Heart },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <AdminTabButton key={key} active={tab === key} onClick={() => setTab(key)}>
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </AdminTabButton>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: `${palette.error}55`, backgroundColor: `${palette.error}14`, color: palette.error }}>
            {activityLoadErrorMessage(error)}
          </div>
        ) : null}

        {isLoading ? (
          <p className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
            Loading team operations…
          </p>
        ) : null}

        {!isLoading && tab === "feed" ? (
          dashboard.timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-14 text-center" style={{ borderColor: palette.border }}>
              <p className="text-sm font-medium" style={{ color: palette.text }}>
                Quiet channel
              </p>
              <p className="mt-2 text-sm" style={{ color: palette.textSecondary }}>
                No activity matches your filters for this period.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {dashboard.timeline.map((e) => (
                <li key={e.id} className="rounded-2xl border p-4" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs" style={{ color: palette.textSecondary }}>
                      {formatActivityWhen(e.timestamp)}
                    </span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", opsKindColor(e.kind))}>
                      {opsKindLabel(e.kind)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: palette.text }}>
                    {e.memberName}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
                    {e.eventName ?? "Unknown client"} — {e.taskName}
                  </p>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {!isLoading && tab === "people" ? (
          dashboard.members.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
              No team members match these filters.
            </p>
          ) : (
            <ul className="space-y-3">
              {dashboard.members.map((m) => (
                <li key={m.memberId} className="rounded-2xl border p-4" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold" style={{ color: palette.text }}>
                        {m.memberName}
                      </div>
                      <div className="text-xs" style={{ color: palette.textSecondary }}>
                        {m.roleLabel}
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", healthColor(m.health))}>
                      {healthLabel(m.health)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: palette.textSecondary }}>
                    <span>{m.openTasks} open</span>
                    <span>{m.startedInPeriod} started</span>
                    <span>{m.completedInPeriod} completed</span>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {!isLoading && tab === "weddings" ? (
          dashboard.events.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
              No wedding activity for this period.
            </p>
          ) : (
            <ul className="space-y-3">
              {dashboard.events.map((ev) => (
                <li key={ev.eventId} className="rounded-2xl border p-4" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
                  <div className="font-semibold" style={{ color: palette.text }}>
                    {ev.eventName}
                  </div>
                  <div className="mt-2 text-xs" style={{ color: palette.textSecondary }}>
                    {ev.entries.length} activity entries
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </AdminSurface>
    </div>
  );
}
