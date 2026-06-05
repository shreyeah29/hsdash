import { calendarDayKeyFromIso } from "@/lib/calendarUtils";
import { resolveShootClientName } from "@/types/shootClientProfile";
import type { ShootCalendarEntry } from "@/types/domain";

export function shootDayKey(day: string) {
  return calendarDayKeyFromIso(day);
}

export type WeddingArchiveGroup = {
  key: string;
  displayName: string;
  events: ShootCalendarEntry[];
};

export type WeddingsArchiveIndex = {
  years: number[];
  monthsForYear: (year: number) => number[];
  weddingCountForYear: (year: number) => number;
  weddingCountForMonth: (year: number, month: number) => number;
  eventCountForMonth: (year: number, month: number) => number;
  weddingsForMonth: (year: number, month: number) => WeddingArchiveGroup[];
  weddingGroup: (year: number, month: number, weddingKey: string) => WeddingArchiveGroup | null;
};

export function buildWeddingsArchiveIndex(entries: ShootCalendarEntry[]): WeddingsArchiveIndex {
  const byYearMonth = new Map<number, Map<number, ShootCalendarEntry[]>>();
  for (const e of entries) {
    const key = shootDayKey(e.day);
    const [y, m] = key.split("-").map(Number);
    if (!byYearMonth.has(y)) byYearMonth.set(y, new Map());
    const months = byYearMonth.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(e);
  }
  for (const months of byYearMonth.values()) {
    for (const list of months.values()) {
      list.sort((a, b) => shootDayKey(a.day).localeCompare(shootDayKey(b.day)));
    }
  }

  function monthsForYear(year: number) {
    const months = [...(byYearMonth.get(year)?.keys() ?? [])];
    months.sort((a, b) => a - b);
    return months;
  }

  function weddingKeysForMonth(year: number, month: number) {
    const monthEntries = byYearMonth.get(year)?.get(month) ?? [];
    return new Set(monthEntries.map(weddingKeyForEntry));
  }

  function weddingsForMonth(year: number, month: number) {
    const monthEntries = byYearMonth.get(year)?.get(month) ?? [];
    const groups = new Map<string, ShootCalendarEntry[]>();
    for (const e of monthEntries) {
      const k = weddingKeyForEntry(e);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(e);
    }
    return [...groups.entries()]
      .map(([key, events]) => ({
        key,
        displayName: events[0]!.clientName,
        events: [...events].sort((a, b) => shootDayKey(a.day).localeCompare(shootDayKey(b.day))),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  return {
    years: [...byYearMonth.keys()].sort((a, b) => b - a),
    monthsForYear,
    weddingCountForYear(year) {
      const keys = new Set<string>();
      for (const m of monthsForYear(year)) {
        for (const k of weddingKeysForMonth(year, m)) keys.add(k);
      }
      return keys.size;
    },
    weddingCountForMonth(year, month) {
      return weddingKeysForMonth(year, month).size;
    },
    eventCountForMonth(year, month) {
      return byYearMonth.get(year)?.get(month)?.length ?? 0;
    },
    weddingsForMonth,
    weddingGroup(year, month, weddingKey) {
      return weddingsForMonth(year, month).find((g) => g.key === weddingKey) ?? null;
    },
  };
}

// Alias for call sites expecting static factory name
export const WeddingsArchiveIndex = { fromEntries: buildWeddingsArchiveIndex };

export function weddingKeyForEntry(entry: ShootCalendarEntry) {
  const label = canonicalClientLabel(entry);
  if (!label) return `id:${entry.id}`;
  return `g:${label}`;
}

export function canonicalClientLabel(entry: ShootCalendarEntry) {
  const bride = entry.brideName?.trim() ?? "";
  const groom = entry.groomName?.trim() ?? "";
  if (bride || groom) {
    return normalizeClientLabel(
      resolveShootClientName({ isWedding: true, brideName: bride, groomName: groom, clientName: "" }),
    );
  }
  return normalizeClientLabel(entry.clientName);
}

export function normalizeClientLabel(name: string) {
  let s = name.trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/\s+/g, " ");
  s = s.replace(/\s*&\s*/g, " and ");
  s = s.replace(/[^a-z0-9 ]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function shootsForSameClient(all: ShootCalendarEntry[], anchor: ShootCalendarEntry) {
  const key = weddingKeyForEntry(anchor);
  return all
    .filter((e) => weddingKeyForEntry(e) === key)
    .sort((a, b) => shootDayKey(a.day).localeCompare(shootDayKey(b.day)));
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(month: number) {
  if (month < 1 || month > 12) return `Month ${month}`;
  return MONTH_NAMES[month - 1]!;
}
