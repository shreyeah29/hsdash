import type { Task } from "@/types/domain";
import { TaskStatus, Team } from "@/types/domain";

/** Sheet task types (matches production spreadsheet). */
export const SHEET_TASK_TYPES = [
  "DATA_COPY",
  "SNEAK_PEEK_PHOTOS",
  "FULL_SET_PHOTOS",
  "CINEMATIC_HIGHLIGHT",
  "ALBUM_DESIGN",
  "TRADITIONAL_VIDEO",
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
  { taskType: "SNEAK_PEEK_PHOTOS", title: "Sneak peak photos", team: Team.PHOTO_TEAM },
  { taskType: "FULL_SET_PHOTOS", title: "Full set photos", team: Team.PHOTO_TEAM },
  { taskType: "CINEMATIC_HIGHLIGHT", title: "Cinematic highlight", team: Team.CINEMATIC_TEAM },
  { taskType: "ALBUM_DESIGN", title: "Album design", team: Team.ALBUM_TEAM },
  { taskType: "TRADITIONAL_VIDEO", title: "Traditional video", team: Team.TRADITIONAL_TEAM },
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
