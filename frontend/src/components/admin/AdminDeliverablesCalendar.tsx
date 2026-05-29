import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from "lucide-react";
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

function formatFriendlyDay(isoOrKey: string, includeYear = false) {
  const key = isoOrKey.includes("T") ? calendarDayKeyFromIso(isoOrKey) : isoOrKey;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function daysBetween(fromKey: string, toKey: string) {
  const parse = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.round((parse(toKey) - parse(fromKey)) / (1000 * 60 * 60 * 24));
}

function cursorFromDayKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { y, m: m - 1 };
}

function DeliverableCard({ task, tone = "default" }: { task: Task; tone?: "default" | "hero" }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdue = +new Date(task.deadline) < +todayStart;

  return (
    <li
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-sm",
        tone === "hero"
          ? overdue
            ? "border-rose-200 bg-white"
            : "border-violet-200 bg-white"
          : overdue
            ? "border-rose-200 bg-rose-50/80"
            : "border-amber-100 bg-gradient-to-r from-amber-50 to-white",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">{task.event?.clientName ?? "Wedding"}</p>
          <p className="mt-0.5 text-sm text-zinc-800">{taskTypeLabel(task.taskType)}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {task.assignedTo?.name ?? "Unassigned"}
            {task.event?.eventDate ? ` · Event ${formatDisplayDate(task.event.eventDate)}` : ""}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>
    </li>
  );
}

export function AdminDeliverablesCalendar() {
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
    for (const [, list] of m) {
      list.sort((a, b) => a.taskType.localeCompare(b.taskType));
    }
    return m;
  }, [openTasks]);

  const todayDues = useMemo(() => duesByDay.get(todayKey) ?? [], [duesByDay, todayKey]);

  const nextDueDay = useMemo(() => {
    const keys = [...duesByDay.keys()].filter((k) => k > todayKey).sort();
    return keys[0] ?? null;
  }, [duesByDay, todayKey]);

  const nextDueTasks = nextDueDay ? (duesByDay.get(nextDueDay) ?? []) : [];
  const overdueCount = useMemo(
    () => openTasks.filter((t) => calendarDayKeyFromIso(t.deadline) < todayKey).length,
    [openTasks, todayKey],
  );

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
  const friendlyToday = formatFriendlyDay(todayKey);

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  function jumpToDay(key: string) {
    setCursor(cursorFromDayKey(key));
    setSelectedKey(key);
  }

  return (
    <div className="space-y-8">
      <GlassPanel shine className="overflow-hidden p-6 md:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-violet-700">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">Good to see you</p>
            {isLoading ? (
              <h1 className="text-2xl font-semibold text-zinc-900 md:text-3xl">Loading your day…</h1>
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                Hey, today is {friendlyToday}
                {todayDues.length > 0 ? (
                  <>
                    {" "}
                    — you have{" "}
                    <span className="text-violet-700">
                      {todayDues.length} deliverable{todayDues.length === 1 ? "" : "s"} due
                    </span>
                  </>
                ) : null}
              </h1>
            )}
          </div>
        </div>

        {!isLoading && todayDues.length > 0 ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-zinc-700">These are due today:</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {todayDues.map((t) => (
                <DeliverableCard key={t.id} task={t} tone="hero" />
              ))}
            </ul>
          </div>
        ) : null}

        {!isLoading && todayDues.length === 0 ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Nothing due today — you&apos;re clear for {friendlyToday}.
            </p>

            {nextDueDay ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-700">
                  Your <span className="font-semibold text-zinc-900">next due date</span> is{" "}
                  <span className="font-semibold text-violet-800">{formatFriendlyDay(nextDueDay, true)}</span>
                  {daysBetween(todayKey, nextDueDay) === 1
                    ? " — that's tomorrow"
                    : ` — in ${daysBetween(todayKey, nextDueDay)} days`}
                  :
                </p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {nextDueTasks.map((t) => (
                    <DeliverableCard key={t.id} task={t} tone="hero" />
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => jumpToDay(nextDueDay)}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Show {formatFriendlyDay(nextDueDay)} on calendar
                </Button>
              </div>
            ) : openTasks.length === 0 ? (
              <p className="text-sm text-zinc-600">No open deliverables right now — everything&apos;s complete.</p>
            ) : (
              <p className="text-sm text-zinc-600">
                No upcoming deadlines on the calendar
                {overdueCount > 0 ? (
                  <>
                    , but{" "}
                    <button
                      type="button"
                      className="font-semibold text-rose-700 underline-offset-2 hover:underline"
                      onClick={() => {
                        const pastKeys = [...duesByDay.keys()].filter((k) => k < todayKey).sort();
                        const earliest = pastKeys[0];
                        if (earliest) jumpToDay(earliest);
                      }}
                    >
                      {overdueCount} overdue
                    </button>{" "}
                    still need attention — check the calendar below.
                  </>
                ) : (
                  "."
                )}
              </p>
            )}
          </div>
        ) : null}
      </GlassPanel>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 md:text-2xl">Deliverable calendar</h2>
          <p className="mt-1 text-sm text-zinc-600">
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
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
                <p>Nothing due on this date — you&apos;re clear.</p>
                {selectedKey === todayKey && nextDueDay ? (
                  <p className="mt-2">
                    Next up:{" "}
                    <button
                      type="button"
                      className="font-semibold text-violet-700 underline-offset-2 hover:underline"
                      onClick={() => jumpToDay(nextDueDay)}
                    >
                      {formatFriendlyDay(nextDueDay, true)}
                    </button>
                  </p>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedDues.map((t) => (
                  <DeliverableCard key={t.id} task={t} />
                ))}
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
    </div>
  );
}
