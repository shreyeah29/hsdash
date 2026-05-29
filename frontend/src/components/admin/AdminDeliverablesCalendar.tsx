import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Button } from "@/components/ui/button";
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

export function AdminDeliverablesCalendar() {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedKey, setSelectedKey] = useState<string | null>(localDayKey(now.getFullYear(), now.getMonth(), now.getDate()));
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
    for (const [, list] of m) {
      list.sort((a, b) => a.taskType.localeCompare(b.taskType));
    }
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

  const selectedDues = selectedKey ? duesByDay.get(selectedKey) ?? [] : [];
  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  const todayKey = localDayKey(now.getFullYear(), now.getMonth(), now.getDate());

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">Overview</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">Deliverable deadlines</h1>
        <p className="text-sm leading-relaxed text-zinc-600 md:text-[15px]">
          Click any date to see which client deliverables are due that day. Deadlines count from the event (shoot) date.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(320px,420px)]">
        <GlassPanel shine className="overflow-hidden p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{label}</h2>
              <p className="mt-1 text-sm text-zinc-600">{isLoading ? "Loading…" : "Amber dot = deliverable due"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="sm" type="button" className="rounded-xl" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="glass" size="sm" type="button" className="rounded-xl" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:text-xs">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {grid.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`p-${i}`} className="min-h-[96px] rounded-xl bg-zinc-100/40 sm:min-h-[104px]" />;
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
                  className={cn(
                    "cal-cell-premium flex min-h-[96px] flex-col rounded-xl border p-2 text-left text-[11px] sm:min-h-[104px] sm:text-xs",
                    "border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-zinc-300 hover:bg-zinc-50",
                    isToday && "border-cyan-400 ring-1 ring-cyan-200",
                    isSel && "border-violet-400 bg-gradient-to-br from-violet-50 to-cyan-50 ring-1 ring-violet-200",
                  )}
                >
                  <div className="flex items-center justify-between gap-1 font-semibold text-zinc-900">
                    <span>{cell.day}</span>
                    {dueN > 0 ? (
                      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" title="Due" />
                    ) : null}
                  </div>
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dueList.slice(0, 2).map((t) => (
                      <div key={t.id} className="truncate text-zinc-600" title={t.event?.clientName}>
                        {t.event?.clientName ?? "Wedding"}
                      </div>
                    ))}
                    {dueList.length > 2 ? <div className="text-zinc-600">+{dueList.length - 2}</div> : null}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">Deadline rules from event day:</span>{" "}
            {DELIVERABLE_DEADLINE_DAYS.map((d) => `${d.label} +${d.days}d`).join(" · ")}
          </div>
        </GlassPanel>

        <motion.div layout className="xl:sticky xl:top-6 xl:self-start">
          <GlassPanel className="space-y-5 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {selectedKey ? formatDisplayDate(selectedKey) : "Select a day"}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {selectedDues.length > 0
                  ? `${selectedDues.length} deliverable${selectedDues.length === 1 ? "" : "s"} due`
                  : "Pick a date on the calendar"}
              </p>
            </div>

            {!selectedKey ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center text-sm text-zinc-600">
                Select a date to see deliverables due that day.
              </p>
            ) : selectedDues.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center text-sm text-zinc-600">
                Nothing due on this date — you&apos;re clear.
              </p>
            ) : (
              <ul className="space-y-3">
                {selectedDues.map((t) => {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const overdue = +new Date(t.deadline) < +todayStart;
                  return (
                    <li
                      key={t.id}
                      className={cn(
                        "rounded-2xl border px-4 py-3 shadow-sm",
                        overdue ? "border-rose-200 bg-rose-50/80" : "border-amber-100 bg-gradient-to-r from-amber-50 to-white",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">{t.event?.clientName ?? "Wedding"}</p>
                          <p className="mt-0.5 text-sm text-zinc-800">{taskTypeLabel(t.taskType)}</p>
                          <p className="mt-1 text-xs text-zinc-600">
                            {t.assignedTo?.name ?? "Unassigned"}
                            {t.event?.eventDate ? ` · Event ${formatDisplayDate(t.event.eventDate)}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-zinc-100 pt-4">
              <Link to="/admin/deliverables-status" className="text-sm font-medium text-violet-700 hover:underline">
                Open full deliverables sheet →
              </Link>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
