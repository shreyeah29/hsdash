export type WorkShiftSession = {
  id: string;
  day: string;
  clockInAt: string;
  clockOutAt: string | null;
};

export type WorkShiftToday = {
  shiftStartHour: number;
  shiftEndHour: number;
  timezone: string;
  session: WorkShiftSession | null;
};

export type ClockActionResponse = {
  session: WorkShiftSession;
  alert: { message: string } | null;
};

export type AttendanceAlertRow = {
  id: string;
  userId: string;
  sessionId: string | null;
  day: string;
  kind: "LATE_CLOCK_IN" | "EARLY_CLOCK_OUT";
  minutes: number;
  message: string;
  occurredAt: string;
  user: { id: string; name: string; team: string | null; role?: string } | null;
};
