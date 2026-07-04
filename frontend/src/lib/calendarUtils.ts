/** Shared calendar day helpers (local keys + UTC ISO from API). */

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function localDayKey(y: number, monthIndex: number, day: number) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

export function calendarDayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function daysBetweenKeys(fromKey: string, toKey: string) {
  const parse = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  return Math.floor((parse(toKey).getTime() - parse(fromKey).getTime()) / 86400000);
}

/** Whole days past the original deadline (0 if not overdue). */
export function taskDelayDays(deadlineIso: string) {
  const dueKey = calendarDayKeyFromIso(deadlineIso);
  const now = new Date();
  const todayKey = localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  const days = daysBetweenKeys(dueKey, todayKey);
  return days > 0 ? days : 0;
}

/** Calendar day an open deliverable appears on — overdue tasks roll forward to today. */
export function runwayCalendarDayKey(deadlineIso: string, status: string) {
  if (status === "COMPLETED") return calendarDayKeyFromIso(deadlineIso);
  if (taskDelayDays(deadlineIso) > 0) {
    const now = new Date();
    return localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return calendarDayKeyFromIso(deadlineIso);
}

export function runwayStatusIsDelayed(task: { deadline: string; status: string }) {
  return task.status !== "COMPLETED" && taskDelayDays(task.deadline) > 0;
}

export function runwayStatusLabel(task: { deadline: string; status: string }) {
  const delay = taskDelayDays(task.deadline);
  if (delay > 0 && task.status !== "COMPLETED") return `DELAYED · ${delay}d`;
  switch (task.status) {
    case "IN_PROGRESS":
      return "IN PROGRESS";
    case "PENDING":
      return "PENDING";
    case "DELAYED":
      return "DELAYED";
    case "COMPLETED":
      return "COMPLETED";
    default:
      return task.status.replaceAll("_", " ");
  }
}

export function groupOpenTasksByDeadlineDay<T extends { deadline: string; status: string }>(tasks: T[]) {
  const map = new Map<string, T[]>();
  for (const t of tasks) {
    if (t.status === "COMPLETED") continue;
    const key = runwayCalendarDayKey(t.deadline, t.status);
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return map;
}

export function monthRangeIso(y: number, monthIndex: number) {
  const last = new Date(y, monthIndex + 1, 0);
  return { from: localDayKey(y, monthIndex, 1), to: localDayKey(y, monthIndex, last.getDate()) };
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatDisplayDate(isoOrKey: string) {
  const key = isoOrKey.includes("T") ? calendarDayKeyFromIso(isoOrKey) : isoOrKey;
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

export function taskTypeLabel(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

/** Standard deliverable offsets from event (shoot) day. */
export const DELIVERABLE_DEADLINE_DAYS: { label: string; days: number }[] = [
  { label: "Hard drives", days: 60 },
  { label: "Sneak peak", days: 7 },
  { label: "Full set photos", days: 20 },
  { label: "Cinematic video", days: 20 },
  { label: "Reels", days: 20 },
  { label: "Traditional video", days: 45 },
  { label: "Album design", days: 45 },
  { label: "Album print", days: 60 },
];

export function deadlineSummaryText() {
  return DELIVERABLE_DEADLINE_DAYS.map((d) => `${d.label} +${d.days}d`).join(" · ");
}
