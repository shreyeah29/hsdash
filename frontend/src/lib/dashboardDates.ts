/** Local calendar day key YYYY-MM-DD. */
export function localDayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDueToday(deadlineIso: string, ref = new Date()) {
  return localDayKey(new Date(deadlineIso)) === localDayKey(ref);
}

export function isOverdueTask(deadlineIso: string, status: string, ref = new Date()) {
  if (status === "COMPLETED") return false;
  return localDayKey(new Date(deadlineIso)) < localDayKey(ref);
}

/** UTC day key for shoot calendar `day` fields from the API. */
export function utcStoredDayKey(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
