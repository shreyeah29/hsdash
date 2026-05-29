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
  { label: "Data copy", days: 1 },
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
