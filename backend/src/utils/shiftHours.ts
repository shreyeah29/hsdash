export const SHIFT_START_HOUR = 10;
export const SHIFT_END_HOUR = 19;
export const STUDIO_TIMEZONE = "Asia/Kolkata";

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

export function istDayKey(date = new Date()): string {
  const p = istParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function minutesLateForClockIn(date = new Date()): number {
  const p = istParts(date);
  const minutesNow = p.hour * 60 + p.minute;
  const shiftStart = SHIFT_START_HOUR * 60;
  return minutesNow > shiftStart ? minutesNow - shiftStart : 0;
}

export function minutesEarlyForClockOut(date = new Date()): number {
  const p = istParts(date);
  const minutesNow = p.hour * 60 + p.minute;
  const shiftEnd = SHIFT_END_HOUR * 60;
  return minutesNow < shiftEnd ? shiftEnd - minutesNow : 0;
}

export function formatDurationShort(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${mins} min`;
}
