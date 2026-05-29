import type { ShootCalendarEntry } from "@/types/domain";
import { calendarDayKeyFromIso } from "@/lib/calendarUtils";

export const SHOOT_EXPORT_COLUMNS = [
  "DATE",
  "TYPE",
  "CLIENT NAME",
  "EVENT NAME",
  "CLIENT CONTACT",
  "CITY",
  "VENUE",
  "TIME",
  "MUHURUTHAM TIME",
  "ADD ON SERVICES IF ANY",
  "TEAM - PHOTO",
  "TEAM - VIDEO",
] as const;

export type ShootExportRow = Record<(typeof SHOOT_EXPORT_COLUMNS)[number], string>;

export function shootEntryToExportRow(entry: ShootCalendarEntry): ShootExportRow {
  const time =
    entry.startTime && entry.endTime
      ? `${entry.startTime} – ${entry.endTime}`
      : entry.startTime || entry.endTime || "";

  return {
    DATE: calendarDayKeyFromIso(entry.day),
    TYPE: entry.clientType || "",
    "CLIENT NAME": entry.clientName || "",
    "EVENT NAME": entry.eventName || "",
    "CLIENT CONTACT": entry.clientContact || "",
    CITY: entry.city || "",
    VENUE: entry.venue || "",
    TIME: time,
    "MUHURUTHAM TIME": entry.muhuruthamTime || "",
    "ADD ON SERVICES IF ANY": entry.addons || "",
    "TEAM - PHOTO": entry.photoTeam || "",
    "TEAM - VIDEO": entry.videoTeam || "",
  };
}

export function buildShootExportRows(entries: ShootCalendarEntry[]): ShootExportRow[] {
  return [...entries]
    .sort((a, b) => +new Date(a.day) - +new Date(b.day) || a.clientName.localeCompare(b.clientName))
    .map(shootEntryToExportRow);
}

/** Trigger browser download of an editable .xlsx workbook. */
export async function downloadShootCalendarExcel(entries: ShootCalendarEntry[], filename: string) {
  const XLSX = await import("xlsx");
  const rows = buildShootExportRows(entries);
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...SHOOT_EXPORT_COLUMNS] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Shoot calendar");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
