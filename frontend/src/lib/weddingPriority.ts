import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";

export type WeddingUrgency = "act_now" | "this_week" | "on_track" | "all_done";

export type WeddingPriorityRow = {
  eventId: string;
  clientName: string;
  eventDate: string | null;
  urgency: WeddingUrgency;
  urgencyLabel: string;
  urgencyHint: string;
  nextDeadline: string | null;
  nextTaskLabel: string | null;
  daysUntilNext: number | null;
  overdueCount: number;
  dueThisWeekCount: number;
  openCount: number;
  completedCount: number;
  totalCount: number;
  editors: string[];
  upcomingTasks: Task[];
};

const URGENCY_ORDER: Record<WeddingUrgency, number> = {
  act_now: 0,
  this_week: 1,
  on_track: 2,
  all_done: 3,
};

export const URGENCY_META: Record<
  WeddingUrgency,
  { label: string; hint: string; ring: string; bg: string; badge: string; dot: string }
> = {
  act_now: {
    label: "Act now",
    hint: "Overdue or due very soon",
    ring: "ring-rose-200",
    bg: "bg-rose-50/80",
    badge: "bg-rose-100 text-rose-900 border-rose-200",
    dot: "bg-rose-500",
  },
  this_week: {
    label: "This week",
    hint: "Deadlines in the next 7 days",
    ring: "ring-amber-200",
    bg: "bg-amber-50/80",
    badge: "bg-amber-100 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
  on_track: {
    label: "On track",
    hint: "Nothing urgent right now",
    ring: "ring-emerald-200",
    bg: "bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
    dot: "bg-emerald-500",
  },
  all_done: {
    label: "All done",
    hint: "Every deliverable completed",
    ring: "ring-zinc-200",
    bg: "bg-zinc-50",
    badge: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dot: "bg-zinc-400",
  },
};

function taskTitle(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function daysFromToday(deadlineIso: string, ref = new Date()) {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const due = new Date(deadlineIso);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineHint(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function buildWeddingPriorities(tasks: Task[], ref = new Date()): WeddingPriorityRow[] {
  const byEvent = new Map<string, Task[]>();
  for (const t of tasks) {
    const id = t.eventId || t.event?.id;
    if (!id) continue;
    byEvent.set(id, [...(byEvent.get(id) ?? []), t]);
  }

  const rows: WeddingPriorityRow[] = [];

  for (const [eventId, eventTasks] of byEvent.entries()) {
    const clientName = eventTasks[0]?.event?.clientName ?? "Wedding";
    const eventDate = eventTasks[0]?.event?.eventDate ?? null;
    const open = eventTasks.filter((t) => t.status !== TaskStatus.COMPLETED);
    const completedCount = eventTasks.length - open.length;
    const overdueCount = open.filter((t) => daysFromToday(t.deadline, ref) < 0).length;
    const dueThisWeekCount = open.filter((t) => {
      const d = daysFromToday(t.deadline, ref);
      return d >= 0 && d <= 7;
    }).length;

    const sortedOpen = [...open].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));
    const next = sortedOpen[0] ?? null;
    const daysUntilNext = next ? daysFromToday(next.deadline, ref) : null;

    let urgency: WeddingUrgency;
    if (open.length === 0) urgency = "all_done";
    else if (overdueCount > 0 || daysUntilNext === 0) urgency = "act_now";
    else if (daysUntilNext !== null && daysUntilNext <= 3) urgency = "act_now";
    else if (daysUntilNext !== null && daysUntilNext <= 7) urgency = "this_week";
    else urgency = "on_track";

    const meta = URGENCY_META[urgency];
    const editors = Array.from(
      new Set(open.map((t) => t.assignedTo?.name).filter((n): n is string => Boolean(n))),
    );

    rows.push({
      eventId,
      clientName,
      eventDate,
      urgency,
      urgencyLabel: meta.label,
      urgencyHint:
        urgency === "act_now" && next
          ? deadlineHint(daysUntilNext!)
          : urgency === "this_week" && next
            ? deadlineHint(daysUntilNext!)
            : meta.hint,
      nextDeadline: next?.deadline ?? null,
      nextTaskLabel: next ? taskTitle(next.taskType) : null,
      daysUntilNext,
      overdueCount,
      dueThisWeekCount,
      openCount: open.length,
      completedCount,
      totalCount: eventTasks.length,
      editors,
      upcomingTasks: sortedOpen.slice(0, 4),
    });
  }

  return rows.sort((a, b) => {
    const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (u !== 0) return u;
    return (a.daysUntilNext ?? 999) - (b.daysUntilNext ?? 999);
  });
}

export function groupByUrgency(rows: WeddingPriorityRow[]) {
  return {
    actNow: rows.filter((r) => r.urgency === "act_now"),
    thisWeek: rows.filter((r) => r.urgency === "this_week"),
    onTrack: rows.filter((r) => r.urgency === "on_track"),
    allDone: rows.filter((r) => r.urgency === "all_done"),
  };
}
