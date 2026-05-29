import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";

/** Sheet row task types (matches production spreadsheet columns). */
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

export type SheetColumnDef =
  | { id: string; kind: "assignee"; taskType: SheetTaskType; label: string }
  | { id: string; kind: "status"; taskType: SheetTaskType; label: string };

/** Column order matches the studio spreadsheet. */
export const WEDDING_DELIVERABLES_SHEET_COLUMNS: SheetColumnDef[] = [
  { id: "data-copy-status", kind: "status", taskType: "DATA_COPY", label: "DATA COPY" },
  { id: "data-copy-spoc", kind: "assignee", taskType: "DATA_COPY", label: "DATA COPY SPOC" },
  { id: "sneak-assignee", kind: "assignee", taskType: "SNEAK_PEEK_PHOTOS", label: "SNEAK PEAK PHOTOS" },
  { id: "sneak-status", kind: "status", taskType: "SNEAK_PEEK_PHOTOS", label: "SNEAK PHOTOS STATUS" },
  { id: "fullset-assignee", kind: "assignee", taskType: "FULL_SET_PHOTOS", label: "FULL SET PHOTOS" },
  { id: "fullset-status", kind: "status", taskType: "FULL_SET_PHOTOS", label: "FULL SET PHOTOS STATUS" },
  { id: "highlight-assignee", kind: "assignee", taskType: "CINEMATIC_HIGHLIGHT", label: "CINEMATIC HIGHLIGHT" },
  { id: "highlight-status", kind: "status", taskType: "CINEMATIC_HIGHLIGHT", label: "CINEMATIC HIGHLIGHT STATUS" },
  { id: "album-assignee", kind: "assignee", taskType: "ALBUM_DESIGN", label: "ALBUM DESIGN" },
  { id: "album-status", kind: "status", taskType: "ALBUM_DESIGN", label: "ALBUM DESIGN STATUS" },
  { id: "traditional-assignee", kind: "assignee", taskType: "TRADITIONAL_VIDEO", label: "TRADITIONAL VIDEO" },
  { id: "traditional-status", kind: "status", taskType: "TRADITIONAL_VIDEO", label: "TRADITIONAL VIDEO STATUS" },
  { id: "print-assignee", kind: "assignee", taskType: "ALBUM_PRINT", label: "ALBUM PRINT" },
  { id: "print-status", kind: "status", taskType: "ALBUM_PRINT", label: "ALBUM PRINT STATUS" },
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
