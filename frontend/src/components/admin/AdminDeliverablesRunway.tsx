import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminSurface } from "@/components/admin/AdminSurface";
import { useAdminThemeStore } from "@/store/adminTheme";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  calendarDayKeyFromIso,
  formatDisplayDate,
  localDayKey,
  monthRangeIso,
  taskTypeLabel,
  DELIVERABLE_DEADLINE_DAYS,
} from "@/lib/calendarUtils";

type OverviewPayload = { tasks: Task[] };

async function fetchOverviewTasks() {
  const { data } = await api.get<OverviewPayload>("/admin/overview");
  return data.tasks;
}

function RunwayTaskCard({ task }: { task: Task }) {
  const palette = useAdminThemeStore((s) => s.palette);
  const overdue = +new Date(task.deadline) < +new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <li
      className="rounded-2xl border px-4 py-3"
      style={{
        backgroundColor: palette.card,
        borderColor: overdue ? `${palette.error}55` : palette.border,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold" style={{ color: palette.text }}>
            {task.event?.clientName ?? "Wedding"}
          </p>
          <p className="mt-0.5 text-sm" style={{ color: palette.textSecondary }}>
            {taskTypeLabel(task.taskType)}
          </p>
          <p className="mt-1 text-xs" style={{ color: palette.textSecondary }}>
            {task.assignedTo?.name ?? "Unassigned"}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>
    </li>
  );
}

export function AdminDeliverablesRunway() {
  const palette = useAdminThemeStore((s) => s.palette);
  const now = new Date();
  const todayKey = localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedKey, setSelectedKey] = useState<string | null>(todayKey);
  const { from, to } = monthRangeIso(cursor.y, cursor.m);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchOverviewTasks,
    refetchOnWindowFocus: true,
  });

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== TaskStatus.COMPLETED), [tasks]);

  const duesByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of openTasks) {
      const dk = calendarDayKeyFromIso(t.deadline);
      m.set(dk, [...(m.get(dk) ?? []), t]);
    }
    for (const [, list] of m) list.sort((a, b) => a.taskType.localeCompare(b.taskType));
    return m;
  }, [openTasks]);

  const grid = useMemo(() => {
    const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { day: number | null }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [cursor.y, cursor.m]);

  const selectedDues = selectedKey ? (duesByDay.get(selectedKey) ?? []) : [];
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,380px)]">
      <AdminSurface className="overflow-hidden">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: palette.text }}>
              {label}
            </h2>
            <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
              {isLoading ? "Loading…" : "Amber dot = deliverable due"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: palette.border, color: palette.text }}
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ borderColor: palette.border, color: palette.text }}
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide sm:text-xs"
          style={{ color: palette.textSecondary }}
        >
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {grid.map((cell, i) => {
            if (cell.day === null) {
              return (
                <div
                  key={`p-${i}`}
                  className="min-h-[88px] rounded-xl sm:min-h-[96px]"
                  style={{ backgroundColor: `${palette.border}22` }}
                />
              );
            }
            const key = localDayKey(cursor.y, cursor.m, cell.day);
            const dueList = duesByDay.get(key) ?? [];
            const inMonth = key >= from && key <= to;
            const dueN = inMonth ? dueList.length : 0;
            const isToday = key === todayKey;
            const isSel = selectedKey === key;

            return (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedKey(key)}
                className={cn("flex min-h-[88px] flex-col rounded-xl border p-2 text-left text-[11px] sm:min-h-[96px] sm:text-xs")}
                style={{
                  backgroundColor: isSel ? `${palette.accent}18` : palette.card,
                  borderColor: isToday ? palette.accent : isSel ? `${palette.accent}66` : palette.border,
                  color: palette.text,
                  boxShadow: isSel ? `0 0 0 1px ${palette.accent}33` : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1 font-semibold">
                  <span>{cell.day}</span>
                  {dueN > 0 ? <span className="h-2 w-2 rounded-full bg-amber-400" title="Due" /> : null}
                </div>
                <div className="mt-1 space-y-0.5 overflow-hidden" style={{ color: palette.textSecondary }}>
                  {dueList.slice(0, 2).map((t) => (
                    <div key={t.id} className="truncate" title={t.event?.clientName}>
                      {t.event?.clientName ?? "Wedding"}
                    </div>
                  ))}
                  {dueList.length > 2 ? <div>+{dueList.length - 2}</div> : null}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div
          className="mt-5 rounded-xl border px-4 py-3 text-xs"
          style={{ borderColor: palette.border, backgroundColor: `${palette.surface}88`, color: palette.textSecondary }}
        >
          <span className="font-semibold" style={{ color: palette.text }}>
            Deadline rules from event day:
          </span>{" "}
          {DELIVERABLE_DEADLINE_DAYS.map((d) => `${d.label} +${d.days}d`).join(" · ")}
        </div>
      </AdminSurface>

      <AdminSurface className="xl:sticky xl:top-6 xl:self-start">
        <div>
          <h2 className="text-lg font-bold" style={{ color: palette.text }}>
            {selectedKey ? formatDisplayDate(selectedKey) : "Select a day"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
            {selectedDues.length > 0
              ? `${selectedDues.length} deliverable${selectedDues.length === 1 ? "" : "s"} due`
              : "Pick a date on the calendar"}
          </p>
        </div>

        {!selectedKey || selectedDues.length === 0 ? (
          <p
            className="mt-5 rounded-xl border border-dashed py-12 text-center text-sm"
            style={{ borderColor: palette.border, color: palette.textSecondary }}
          >
            {selectedKey ? "Nothing due on this date — you're clear." : "Select a date to see deliverables due that day."}
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {selectedDues.map((t) => (
              <RunwayTaskCard key={t.id} task={t} />
            ))}
          </ul>
        )}
      </AdminSurface>
    </div>
  );
}
