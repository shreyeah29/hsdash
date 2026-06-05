import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ShootCalendarEntry } from "@/types/domain";
import { localDayKey } from "@/lib/calendarUtils";

export function wideRangeKeys() {
  const now = new Date();
  const from = localDayKey(now.getFullYear() - 8, 0, 1);
  const to = localDayKey(now.getFullYear() + 2, 11, 31);
  return { from, to };
}

async function fetchEntries(from: string, to: string) {
  const { data } = await api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
    params: { from, to },
  });
  return data.entries;
}

export function useWideRangeCalendarEntries() {
  const { from, to } = wideRangeKeys();
  return useQuery({
    queryKey: ["production-calendar-entries", "wide", from, to],
    queryFn: () => fetchEntries(from, to),
  });
}
