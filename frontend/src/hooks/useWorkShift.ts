import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { crewLiveQueryOptions } from "@/hooks/useCrewLiveData";
import { useAuthStore } from "@/store/auth";
import type { ClockActionResponse, WorkShiftToday } from "@/types/attendance";

const STORAGE_PREFIX = "hswf-work-shift";

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function persistWorkShift(userId: string, session: WorkShiftToday["session"]) {
  if (!session) {
    localStorage.removeItem(storageKey(userId));
    return;
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(session));
}

export function readPersistedWorkShift(userId: string): WorkShiftToday["session"] | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as WorkShiftToday["session"];
  } catch {
    return null;
  }
}

export function useWorkShift() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ["work-shift-today", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get<WorkShiftToday>("/attendance/today");
      if (userId) persistWorkShift(userId, data.session);
      return data;
    },
    ...crewLiveQueryOptions,
    placeholderData: () => {
      if (!userId) return undefined;
      const cached = readPersistedWorkShift(userId);
      if (!cached) return undefined;
      return {
        shiftStartHour: 10,
        shiftEndHour: 19,
        timezone: "Asia/Kolkata",
        session: cached,
      } satisfies WorkShiftToday;
    },
  });

  const clockIn = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ClockActionResponse>("/attendance/clock-in");
      return data;
    },
    onSuccess: (data) => {
      if (userId) persistWorkShift(userId, data.session);
      void qc.invalidateQueries({ queryKey: ["work-shift-today", userId] });
    },
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ClockActionResponse>("/attendance/clock-out");
      return data;
    },
    onSuccess: (data) => {
      if (userId) persistWorkShift(userId, data.session);
      void qc.invalidateQueries({ queryKey: ["work-shift-today", userId] });
    },
  });

  return { ...query, clockIn, clockOut };
}
