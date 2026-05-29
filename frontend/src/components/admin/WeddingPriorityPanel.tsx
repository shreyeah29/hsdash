import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Flame } from "lucide-react";
import type { Task } from "@/types/domain";
import {
  URGENCY_META,
  buildWeddingPriorities,
  groupByUrgency,
  type WeddingPriorityRow,
  type WeddingUrgency,
} from "@/lib/weddingPriority";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { cn } from "@/lib/utils";

function taskTitle(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function WeddingRow({ row, defaultOpen }: { row: WeddingPriorityRow; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? row.urgency === "act_now");
  const meta = URGENCY_META[row.urgency];
  const pct = row.totalCount ? Math.round((row.completedCount / row.totalCount) * 100) : 0;

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-white shadow-sm ring-1", meta.ring)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-zinc-50/80 sm:px-5"
      >
        <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-zinc-900">{row.clientName}</p>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", meta.badge)}>
              {row.urgencyLabel}
            </span>
            {row.overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                <Flame className="h-3 w-3" aria-hidden />
                {row.overdueCount} overdue
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-zinc-600">{row.urgencyHint}</p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
            {row.eventDate ? <span>Event {new Date(row.eventDate).toLocaleDateString()}</span> : null}
            {row.nextTaskLabel && row.nextDeadline ? (
              <span>
                Next: <span className="font-medium text-zinc-800">{row.nextTaskLabel}</span> ·{" "}
                {new Date(row.nextDeadline).toLocaleDateString()}
              </span>
            ) : null}
            <span>
              {row.completedCount}/{row.totalCount} done ({pct}%)
            </span>
            {row.editors.length > 0 ? <span>Editors: {row.editors.join(", ")}</span> : null}
          </div>
        </div>

        <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && row.upcomingTasks.length > 0 ? (
        <div className={cn("border-t px-4 py-3 sm:px-5", meta.bg)}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">Coming up</p>
          <div className="space-y-2">
            {row.upcomingTasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{taskTitle(t.taskType)}</p>
                  <p className="text-xs text-zinc-600">
                    {t.assignedTo?.name ?? "Unassigned"} · {new Date(t.deadline).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UrgencySection({
  title,
  subtitle,
  urgency,
  rows,
  defaultOpenFirst,
}: {
  title: string;
  subtitle: string;
  urgency: WeddingUrgency;
  rows: WeddingPriorityRow[];
  defaultOpenFirst?: boolean;
}) {
  if (rows.length === 0) return null;
  const meta = URGENCY_META[urgency];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-600">{subtitle}</p>
        </div>
        <span className="ml-auto rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700">
          {rows.length}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <WeddingRow key={row.eventId} row={row} defaultOpen={defaultOpenFirst && i === 0} />
        ))}
      </div>
    </div>
  );
}

export function WeddingPriorityPanel({ tasks, isLoading }: { tasks: Task[]; isLoading?: boolean }) {
  const rows = useMemo(() => buildWeddingPriorities(tasks), [tasks]);
  const groups = useMemo(() => groupByUrgency(rows), [rows]);

  const focusCount = groups.actNow.length + groups.thisWeek.length;

  if (isLoading) {
    return <GlassPanel className="p-10 text-center text-sm text-zinc-600">Loading wedding priorities…</GlassPanel>;
  }

  if (rows.length === 0) {
    return (
      <GlassPanel className="p-14 text-center text-sm text-zinc-600">
        No weddings with deliverables yet. Log shoots and activate tasks to see daily priorities here.
      </GlassPanel>
    );
  }

  return (
    <GlassPanel shine className="space-y-8 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Which weddings need you today</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Sorted by nearest deadline — <span className="font-medium text-rose-700">{groups.actNow.length} need action now</span>
            {groups.thisWeek.length > 0 ? (
              <>
                , <span className="font-medium text-amber-800">{groups.thisWeek.length} this week</span>
              </>
            ) : null}
            .
          </p>
        </div>
        <Link
          to="/admin/deliverables-status"
          className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
        >
          Full deliverables sheet →
        </Link>
      </div>

      {focusCount === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Nothing urgent today — all active weddings are on track or complete.
        </div>
      ) : null}

      <UrgencySection
        title="Act now"
        subtitle="Overdue or due in the next 3 days"
        urgency="act_now"
        rows={groups.actNow}
        defaultOpenFirst
      />
      <UrgencySection title="This week" subtitle="Deadlines in the next 7 days" urgency="this_week" rows={groups.thisWeek} />
      <UrgencySection title="On track" subtitle="No urgent deadlines — monitor only" urgency="on_track" rows={groups.onTrack} />
      <UrgencySection title="All done" subtitle="Every deliverable completed" urgency="all_done" rows={groups.allDone} />
    </GlassPanel>
  );
}
