import type { Task } from "@/types/domain";
import { TaskStatus, Team } from "@/types/domain";

/** Sheet task types (matches production spreadsheet). */
export const SHEET_TASK_TYPES = [
  "DATA_COPY",
  "SNEAK_PEEK_PHOTOS",
  "FULL_SET_PHOTOS",
  "CINEMATIC_VIDEO",
  "REELS",
  "TRADITIONAL_VIDEO",
  "ALBUM_DESIGN",
  "ALBUM_PRINT",
] as const;

export type SheetTaskType = (typeof SHEET_TASK_TYPES)[number];

export type DeliverableGroupDef = {
  taskType: SheetTaskType;
  title: string;
  team: Team;
};

/** One block per deliverable — assignee + status shown together (no wide table). */
export const DELIVERABLE_GROUPS: DeliverableGroupDef[] = [
  { taskType: "DATA_COPY", title: "Data copy", team: Team.COORDINATOR_TEAM },
  { taskType: "SNEAK_PEEK_PHOTOS", title: "Sneak peak", team: Team.PHOTO_TEAM },
  { taskType: "FULL_SET_PHOTOS", title: "Full set photos", team: Team.PHOTO_TEAM },
  { taskType: "CINEMATIC_VIDEO", title: "Cinematic video", team: Team.CINEMATIC_TEAM },
  { taskType: "REELS", title: "Reels", team: Team.CINEMATIC_TEAM },
  { taskType: "TRADITIONAL_VIDEO", title: "Traditional video", team: Team.TRADITIONAL_TEAM },
  { taskType: "ALBUM_DESIGN", title: "Album design", team: Team.ALBUM_TEAM },
  { taskType: "ALBUM_PRINT", title: "Album print", team: Team.ALBUM_TEAM },
];

export type WeddingSheetRow = {
  key: string;
  clientName: string;
  eventDate: string | null;
  tasksByType: Map<string, Task>;
  tasks: Task[];
};

export function sheetStatusLabel(status: TaskStatus) {
  switch (status) {
    case TaskStatus.COMPLETED:
      return "Done";
    case TaskStatus.IN_PROGRESS:
      return "WIP";
    case TaskStatus.DELAYED:
      return "Delayed";
    default:
      return "Pending";
  }
}

/** Short titles for compact wedding-archive badges. */
export const DELIVERABLE_BADGE_LABELS: Record<string, string> = {
  DATA_COPY: "Data copy",
  SNEAK_PEEK_PHOTOS: "Sneak peek",
  FULL_SET_PHOTOS: "Full set",
  CINEMATIC_VIDEO: "Cinematic",
  REELS: "Reels",
  TRADITIONAL_VIDEO: "Traditional",
  ALBUM_DESIGN: "Album design",
  ALBUM_PRINT: "Album print",
  PREVIEW_PHOTOS: "Preview",
  FULL_PHOTOS: "Full photos",
  CINEMATIC_HIGHLIGHT: "Highlight",
};

export type DeliverableStatusBadge = {
  key: string;
  label: string;
  tone: "pending" | "wip" | "delayed";
};

/** Open deliverables as short status chips (e.g. "Album design pending"). */
export function openDeliverableBadges(tasks: Task[], max = 4): {
  badges: DeliverableStatusBadge[];
  overflow: number;
  totalOpen: number;
  total: number;
} {
  const order = new Map(SHEET_TASK_TYPES.map((t, i) => [t, i]));
  const open = tasks
    .filter((t) => t.status !== TaskStatus.COMPLETED)
    .sort((a, b) => (order.get(a.taskType as SheetTaskType) ?? 99) - (order.get(b.taskType as SheetTaskType) ?? 99));

  const badges: DeliverableStatusBadge[] = open.slice(0, max).map((t) => {
    const name = DELIVERABLE_BADGE_LABELS[t.taskType] ?? t.taskType.replaceAll("_", " ").toLowerCase();
    if (t.status === TaskStatus.IN_PROGRESS) {
      return { key: t.id, label: `${name} WIP`, tone: "wip" };
    }
    if (t.status === TaskStatus.DELAYED) {
      return { key: t.id, label: `${name} delayed`, tone: "delayed" };
    }
    return { key: t.id, label: `${name} pending`, tone: "pending" };
  });

  return {
    badges,
    overflow: Math.max(0, open.length - max),
    totalOpen: open.length,
    total: tasks.length,
  };
}

export function teamAccent(team: Team) {
  switch (team) {
    case Team.PHOTO_TEAM:
      return { ring: "ring-violet-200", bg: "bg-violet-50", dot: "bg-violet-500", text: "text-violet-900" };
    case Team.CINEMATIC_TEAM:
      return { ring: "ring-cyan-200", bg: "bg-cyan-50", dot: "bg-cyan-500", text: "text-cyan-900" };
    case Team.TRADITIONAL_TEAM:
      return { ring: "ring-amber-200", bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-900" };
    case Team.ALBUM_TEAM:
      return { ring: "ring-fuchsia-200", bg: "bg-fuchsia-50", dot: "bg-fuchsia-500", text: "text-fuchsia-900" };
    case Team.COORDINATOR_TEAM:
      return { ring: "ring-orange-200", bg: "bg-orange-50", dot: "bg-orange-500", text: "text-orange-900" };
    default:
      return { ring: "ring-zinc-200", bg: "bg-zinc-50", dot: "bg-zinc-400", text: "text-zinc-800" };
  }
}

function eventKey(t: Task) {
  return t.eventId || t.event?.id || t.id;
}

export function buildWeddingSheetRows(tasks: Task[]): WeddingSheetRow[] {
  const byEvent = new Map<string, Task[]>();
  for (const t of tasks) {
    const k = eventKey(t);
    byEvent.set(k, [...(byEvent.get(k) ?? []), t]);
  }

  return Array.from(byEvent.entries())
    .map(([key, list]) => {
      const clientName = list[0]?.event?.clientName ?? "Wedding";
      const eventDate = list[0]?.event?.eventDate ?? null;
      const tasksByType = new Map(list.map((t) => [t.taskType, t]));
      return { key, clientName, eventDate, tasksByType, tasks: list };
    })
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
}

export function filterWeddingSheetRows(rows: WeddingSheetRow[], needle: string) {
  const q = needle.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    if (row.clientName.toLowerCase().includes(q)) return true;
    for (const t of row.tasks) {
      if (t.taskType.toLowerCase().includes(q)) return true;
      if (t.assignedTo?.name?.toLowerCase().includes(q)) return true;
    }
    return false;
  });
}

export function rowProgress(row: WeddingSheetRow) {
  const total = DELIVERABLE_GROUPS.filter((g) => row.tasksByType.has(g.taskType)).length;
  const done = DELIVERABLE_GROUPS.filter((g) => {
    const t = row.tasksByType.get(g.taskType);
    return t?.status === TaskStatus.COMPLETED;
  }).length;
  return { done, total };
}
