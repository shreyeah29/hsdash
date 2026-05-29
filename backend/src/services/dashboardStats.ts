import { TaskStatus } from "@prisma/client";

/** Local calendar day key YYYY-MM-DD for deadline comparisons. */
export function localDayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Day key for Prisma `@db.Date` / UTC-noon shoot rows. */
export function utcStoredDayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function monthRangeKeys(ref = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const last = new Date(y, m + 1, 0);
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(last.getDate())}`,
  };
}

/** Today through ~3 months ahead for upcoming shoots. */
export function upcomingShootRangeKeys(ref = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = localDayKey(ref);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 3, ref.getDate());
  return {
    from,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  };
}

export function computeTaskDashboardStats(
  tasks: Array<{ status: TaskStatus; deadline: Date }>,
  ref = new Date(),
) {
  const todayKey = localDayKey(ref);
  let dueToday = 0;
  let overdue = 0;
  let completed = 0;
  let pending = 0;

  for (const t of tasks) {
    const deadlineKey = localDayKey(t.deadline);
    if (t.status === TaskStatus.COMPLETED) {
      completed++;
      continue;
    }
    if (t.status === TaskStatus.PENDING) pending++;
    if (deadlineKey === todayKey) dueToday++;
    if (deadlineKey < todayKey) overdue++;
  }

  const total = tasks.length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const open = total - completed;

  return { dueToday, overdue, completed, pending, total, open, completionRate };
}
