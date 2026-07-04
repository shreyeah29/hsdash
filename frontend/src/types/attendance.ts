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
