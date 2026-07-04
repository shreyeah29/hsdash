import { calendarDayKeyFromIso, localDayKey } from "@/lib/calendarUtils";
import type { AttendanceAlertRow } from "@/types/attendance";
import type { Task, TaskStatus, Team, User } from "@/types/domain";

export type ActivityPeriodFilter = "today" | "week" | "month" | "all";
export type ActivityTypeFilter = "all" | "assigned" | "started" | "completed" | "delayed" | "attendance";
export type OpsActivityKind = "assigned" | "started" | "completed" | "delayed" | "attendance";
export type MemberHealthStatus = "available" | "busy" | "delayed" | "noActivity";

export type TaskActivityRow = {
  id: string;
  taskId: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  createdAt: string;
  actor: { id: string; name: string; email: string; team: Team | null } | null;
  task: {
    id: string;
    taskType: string;
    assignedTeam: string;
    assignedToId?: string | null;
    assignedTo?: { id: string; name: string } | null;
    eventId?: string;
    event: { id?: string; clientName: string; eventDate?: string } | null;
  };
};

export type OpsActivityEntry = {
  id: string;
  taskId: string;
  eventId: string;
  kind: OpsActivityKind;
  timestamp: Date;
  memberId: string;
  memberName: string;
  memberTeam?: string;
  eventName?: string;
  taskName: string;
  synthetic: boolean;
};

export type OpsDashboardFilters = {
  period: ActivityPeriodFilter;
  eventId?: string | null;
  memberId?: string | null;
  type: ActivityTypeFilter;
  search: string;
  excludeMemberId?: string | null;
};

export type OpsOverviewMetrics = {
  activeMembers: number;
  assignedToday: number;
  startedToday: number;
  completedToday: number;
  delayedTasks: number;
  idleMembers: number;
};

export type TeamHealthMetrics = {
  available: number;
  busy: number;
  delayed: number;
  noActivity: number;
};

export type MemberOpsGroup = {
  memberId: string;
  memberName: string;
  roleLabel: string;
  openTasks: number;
  startedInPeriod: number;
  completedInPeriod: number;
  lastActivity: Date | null;
  entries: OpsActivityEntry[];
  health: MemberHealthStatus;
};

export type EventOpsGroup = {
  eventId: string;
  eventName: string;
  assignedMembers: string[];
  startedMembers: string[];
  completedMembers: string[];
  delayedMembers: string[];
  entries: OpsActivityEntry[];
};

export type OpsDashboardData = {
  overview: OpsOverviewMetrics;
  health: TeamHealthMetrics;
  members: MemberOpsGroup[];
  events: EventOpsGroup[];
  timeline: OpsActivityEntry[];
  eventOptions: { id: string; label: string }[];
  memberOptions: { id: string; label: string }[];
};

function inPeriod(at: Date, period: ActivityPeriodFilter) {
  const now = new Date();
  switch (period) {
    case "today":
      return localDayKey(at.getFullYear(), at.getMonth(), at.getDate()) === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      return at.getTime() > now.getTime() - 7 * 86400000;
    case "month":
      return at.getTime() > now.getTime() - 30 * 86400000;
    case "all":
      return true;
  }
}

function isToday(at: Date) {
  const now = new Date();
  return localDayKey(at.getFullYear(), at.getMonth(), at.getDate()) === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function classifyActivityKind(a: TaskActivityRow): OpsActivityKind {
  if (a.newStatus === "DELAYED") return "delayed";
  if (a.previousStatus && a.newStatus === "COMPLETED") return "completed";
  if (a.previousStatus === "PENDING" && a.newStatus === "IN_PROGRESS") return "started";
  if (a.newStatus === "IN_PROGRESS") return "started";
  if (a.newStatus === "COMPLETED") return "completed";
  return "started";
}

export function opsKindLabel(kind: OpsActivityKind) {
  switch (kind) {
    case "assigned":
      return "Assigned";
    case "started":
      return "Started";
    case "completed":
      return "Completed";
    case "delayed":
      return "Delayed";
    case "attendance":
      return "Attendance";
  }
}

export function opsKindColor(kind: OpsActivityKind) {
  switch (kind) {
    case "assigned":
      return "text-zinc-600 bg-zinc-100 border-zinc-200";
    case "started":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "completed":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "delayed":
      return "text-rose-700 bg-rose-50 border-rose-200";
    case "attendance":
      return "text-amber-800 bg-amber-50 border-amber-200";
  }
}

export function healthLabel(status: MemberHealthStatus) {
  switch (status) {
    case "available":
      return "Available";
    case "busy":
      return "In progress";
    case "delayed":
      return "Delayed";
    case "noActivity":
      return "No recent activity";
  }
}

export function healthColor(status: MemberHealthStatus) {
  switch (status) {
    case "available":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "busy":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "delayed":
      return "text-rose-700 bg-rose-50 border-rose-200";
    case "noActivity":
      return "text-amber-800 bg-amber-50 border-amber-200";
  }
}

function teamLabel(teamKey: string | null | undefined) {
  if (!teamKey) return "Team";
  return teamKey.replaceAll("_", " ");
}

function memberRoleLabel(roster: User | undefined, teamKey: string | null | undefined) {
  if (roster?.designation) return roster.designation;
  return teamLabel(teamKey);
}

export function opsActivityFromRow(a: TaskActivityRow): OpsActivityEntry {
  return {
    id: a.id,
    taskId: a.taskId,
    eventId: a.task.event?.id ?? a.task.eventId ?? "",
    kind: classifyActivityKind(a),
    timestamp: new Date(a.createdAt),
    memberId: a.actor?.id ?? a.task.assignedToId ?? a.task.assignedTo?.id ?? "unknown",
    memberName: a.actor?.name ?? a.task.assignedTo?.name ?? "Unknown",
    memberTeam: a.actor?.team ?? a.task.assignedTeam,
    eventName: a.task.event?.clientName,
    taskName: a.task.taskType.replaceAll("_", " "),
    synthetic: false,
  };
}

function opsActivityFromAttendance(alert: AttendanceAlertRow): OpsActivityEntry {
  return {
    id: alert.id,
    taskId: "",
    eventId: "",
    kind: "attendance",
    timestamp: new Date(alert.occurredAt),
    memberId: alert.userId,
    memberName: alert.user?.name ?? "Unknown",
    memberTeam: alert.user?.team ?? undefined,
    eventName: "Attendance",
    taskName: alert.message,
    synthetic: false,
  };
}

function opsActivityFromTask(task: Task): OpsActivityEntry | null {
  if (!task.assignedToId) return null;
  return {
    id: `assign-${task.id}`,
    taskId: task.id,
    eventId: task.eventId,
    kind: "assigned",
    timestamp: new Date(task.createdAt),
    memberId: task.assignedToId,
    memberName: task.assignedTo?.name ?? "Unassigned",
    memberTeam: task.assignedTeam,
    eventName: task.event?.clientName,
    taskName: task.taskType.replaceAll("_", " "),
    synthetic: true,
  };
}

export function buildOpsEntries(activities: TaskActivityRow[], tasks: Task[], attendanceAlerts: AttendanceAlertRow[] = []) {
  const activityTaskIds = new Set(activities.map((a) => a.taskId));
  const entries = activities.map(opsActivityFromRow);
  for (const task of tasks) {
    if (activityTaskIds.has(task.id)) continue;
    const synthetic = opsActivityFromTask(task);
    if (synthetic) entries.push(synthetic);
  }
  for (const alert of attendanceAlerts) {
    entries.push(opsActivityFromAttendance(alert));
  }
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries;
}

export function applyOpsFilters(entries: OpsActivityEntry[], filters: OpsDashboardFilters) {
  const q = filters.search.trim().toLowerCase();
  return entries.filter((e) => {
    if (!inPeriod(e.timestamp, filters.period)) return false;
    if (filters.excludeMemberId && e.memberId === filters.excludeMemberId) return false;
    if (filters.eventId && e.eventId !== filters.eventId) return false;
    if (filters.memberId && e.memberId !== filters.memberId) return false;
    if (filters.type !== "all" && e.kind !== filters.type) return false;
    if (q) {
      const hay = `${e.memberName} ${e.eventName ?? ""} ${e.taskName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function memberHealth(
  memberTasks: Task[],
  memberEntries: OpsActivityEntry[],
  period: ActivityPeriodFilter,
): MemberHealthStatus {
  const open = memberTasks.filter((t) => t.status !== "COMPLETED");
  if (!open.length) return "available";
  if (open.some((t) => t.status === "DELAYED")) return "delayed";
  if (open.some((t) => t.status === "IN_PROGRESS")) return "busy";
  const hasActivity = memberEntries.some((e) => inPeriod(e.timestamp, period));
  if (open.length && !hasActivity) return "noActivity";
  return "available";
}

export function buildOpsDashboard(
  activities: TaskActivityRow[],
  tasks: Task[],
  filters: OpsDashboardFilters,
  roster: User[] = [],
  attendanceAlerts: AttendanceAlertRow[] = [],
): OpsDashboardData {
  const allEntries = buildOpsEntries(activities, tasks, attendanceAlerts);
  const filtered = applyOpsFilters(allEntries, filters);
  const rosterById = new Map(roster.map((m) => [m.id, m]));
  const memberIds = new Set<string>();
  for (const e of filtered) {
    if (e.memberId !== "unknown" && e.memberId !== "unassigned") memberIds.add(e.memberId);
  }
  for (const t of tasks) {
    if (t.assignedToId) memberIds.add(t.assignedToId);
  }
  if (filters.excludeMemberId) memberIds.delete(filters.excludeMemberId);

  const eventOptionsMap = new Map<string, string>();
  for (const e of allEntries) {
    if (e.eventId) eventOptionsMap.set(e.eventId, e.eventName ?? "Event");
  }
  for (const t of tasks) {
    eventOptionsMap.set(t.eventId, t.event?.clientName ?? "Event");
  }

  const memberOptions = [...memberIds]
    .map((id) => {
      let name = rosterById.get(id)?.name ?? "Unknown";
      for (const e of allEntries) {
        if (e.memberId === id) {
          name = e.memberName;
          break;
        }
      }
      for (const t of tasks) {
        if (t.assignedToId === id && t.assignedTo?.name) {
          name = t.assignedTo.name;
          break;
        }
      }
      return { id, label: name };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const eventOptions = [...eventOptionsMap.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  let assignedToday = 0;
  let startedToday = 0;
  let completedToday = 0;
  const delayedTasks = tasks.filter((t) => t.status === "DELAYED").length;
  let activeMembers = 0;
  let idleMembers = 0;

  const members: MemberOpsGroup[] = [];
  for (const id of memberIds) {
    const memberTasks = tasks.filter((t) => t.assignedToId === id);
    const memberEntries = filtered.filter((e) => e.memberId === id);
    const openCount = memberTasks.filter((t) => t.status !== "COMPLETED").length;
    const started = memberEntries.filter((e) => e.kind === "started").length;
    const completed = memberEntries.filter((e) => e.kind === "completed").length;
    const last = memberEntries[0]?.timestamp ?? null;
    const teamKey =
      rosterById.get(id)?.team ?? memberEntries[0]?.memberTeam ?? memberTasks[0]?.assignedTeam ?? null;
    const health = memberHealth(memberTasks, memberEntries, filters.period);
    if (memberEntries.length) activeMembers++;
    if (health === "noActivity") idleMembers++;
    members.push({
      memberId: id,
      memberName: rosterById.get(id)?.name ?? memberEntries[0]?.memberName ?? "Unknown",
      roleLabel: memberRoleLabel(rosterById.get(id), teamKey),
      openTasks: openCount,
      startedInPeriod: started,
      completedInPeriod: completed,
      lastActivity: last,
      entries: memberEntries,
      health,
    });
  }

  members.sort(
    (a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0),
  );

  for (const e of filtered) {
    if (e.kind === "assigned" && isToday(e.timestamp)) assignedToday++;
    if (e.kind === "started" && isToday(e.timestamp)) startedToday++;
    if (e.kind === "completed" && isToday(e.timestamp)) completedToday++;
  }

  let available = 0;
  let busy = 0;
  let delayed = 0;
  let noActivity = 0;
  for (const m of members) {
    switch (m.health) {
      case "available":
        available++;
        break;
      case "busy":
        busy++;
        break;
      case "delayed":
        delayed++;
        break;
      case "noActivity":
        noActivity++;
        break;
    }
  }

  const eventsMap = new Map<string, EventOpsGroup>();
  for (const e of filtered) {
    if (!e.eventId) continue;
    const existing = eventsMap.get(e.eventId);
    const assigned = new Set(existing?.assignedMembers ?? []);
    const started = new Set(existing?.startedMembers ?? []);
    const completed = new Set(existing?.completedMembers ?? []);
    const delayedMembers = new Set(existing?.delayedMembers ?? []);
    const entries = [...(existing?.entries ?? []), e];
    switch (e.kind) {
      case "assigned":
        assigned.add(e.memberName);
        break;
      case "started":
        started.add(e.memberName);
        break;
      case "completed":
        completed.add(e.memberName);
        break;
      case "delayed":
        delayedMembers.add(e.memberName);
        break;
      case "attendance":
        break;
    }
    eventsMap.set(e.eventId, {
      eventId: e.eventId,
      eventName: e.eventName ?? existing?.eventName ?? "Event",
      assignedMembers: [...assigned].sort(),
      startedMembers: [...started].sort(),
      completedMembers: [...completed].sort(),
      delayedMembers: [...delayedMembers].sort(),
      entries,
    });
  }

  const events = [...eventsMap.values()].sort((a, b) => a.eventName.localeCompare(b.eventName));

  return {
    overview: {
      activeMembers,
      assignedToday,
      startedToday,
      completedToday,
      delayedTasks,
      idleMembers,
    },
    health: { available, busy, delayed, noActivity },
    members,
    events,
    timeline: filtered,
    eventOptions,
    memberOptions,
  };
}

export function formatActivityWhen(d: Date) {
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDayKey(isoOrKey: string) {
  const key = isoOrKey.includes("T") ? calendarDayKeyFromIso(isoOrKey) : isoOrKey;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
