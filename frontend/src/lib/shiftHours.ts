/** Studio shift helpers — mirrors mobile + backend IST rules (10:00–19:00). */

export const SHIFT_START_HOUR = 10;
export const SHIFT_END_HOUR = 19;
export const STUDIO_TIMEZONE = "Asia/Kolkata";

export const shiftHoursLabel = `${formatShiftHourLabel(SHIFT_START_HOUR)} – ${formatShiftHourLabel(SHIFT_END_HOUR)}`;

export function formatShiftHourLabel(hour24: number) {
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${h} ${suffix}`;
}

type IstParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function istParts(date = new Date()): IstParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hourRaw = parts.hour === "24" ? "0" : parts.hour;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(hourRaw),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function studioNow(): Date {
  const p = istParts();
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

export function studioShiftEndToday(): Date {
  const now = studioNow();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), SHIFT_END_HOUR, 0, 0, 0);
}

export const expectedShiftDurationMs = (SHIFT_END_HOUR - SHIFT_START_HOUR) * 60 * 60 * 1000;

export function studioShiftStartOnDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), SHIFT_START_HOUR, 0, 0, 0);
}

export function studioShiftEndOnDay(day: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), SHIFT_END_HOUR, 0, 0, 0);
}

export function workedDuration(clockIn: Date, clockOut?: Date | null): number {
  const end = clockOut ?? new Date();
  const delta = end.getTime() - clockIn.getTime();
  return delta < 0 ? 0 : delta;
}

export function lateStartDuration(clockIn: Date): number {
  const start = studioShiftStartOnDay(clockIn);
  if (clockIn.getTime() <= start.getTime()) return 0;
  return clockIn.getTime() - start.getTime();
}

export function earlyEndDuration(clockOut: Date): number {
  const end = studioShiftEndOnDay(clockOut);
  if (clockOut.getTime() >= end.getTime()) return 0;
  return end.getTime() - clockOut.getTime();
}

export function shiftOwedDuration(clockIn: Date, clockOut?: Date | null): number {
  const worked = workedDuration(clockIn, clockOut);
  const shortfall = expectedShiftDurationMs - worked;
  return shortfall <= 0 ? 0 : shortfall;
}

export function fullShiftTargetTime(clockIn: Date): Date {
  return new Date(clockIn.getTime() + expectedShiftDurationMs);
}

export function timeUntilShiftEnd(): number {
  const now = studioNow();
  const end = studioShiftEndToday();
  if (now.getTime() >= end.getTime()) return 0;
  return end.getTime() - now.getTime();
}

export function timeUntilFullShift(clockIn: Date): number {
  const target = fullShiftTargetTime(clockIn);
  const now = new Date();
  if (now.getTime() >= target.getTime()) return 0;
  return target.getTime() - now.getTime();
}

export function formatDurationHuman(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
}
