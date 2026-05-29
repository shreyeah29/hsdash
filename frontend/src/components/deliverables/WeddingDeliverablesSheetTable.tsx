import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart } from "lucide-react";
import { api } from "@/services/api";
import type { Task, Team, User } from "@/types/domain";
import {
  DELIVERABLE_GROUPS,
  buildWeddingSheetRows,
  filterWeddingSheetRows,
  rowProgress,
  sheetStatusLabel,
  teamAccent,
  type WeddingSheetRow,
} from "@/lib/deliverablesSheet";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Mode = "coordinator" | "admin";

type Props = {
  mode: Mode;
  tasks: Task[];
  roster: User[];
  searchQuery: string;
  isLoading?: boolean;
  dataUpdatedAt?: number;
};

function assigneesForTeam(roster: User[], team: Team) {
  return roster.filter((u) => u.team === team || u.team === null);
}

function DeliverableTile({
  task,
  title,
  team,
  canAssign,
  roster,
  onAssign,
}: {
  task: Task | undefined;
  title: string;
  team: Team;
  canAssign: boolean;
  roster: User[];
  onAssign: (id: string, assignedToId: string | null) => void;
}) {
  const accent = teamAccent(team);

  if (!task) {
    return (
      <div className={cn("rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-3", accent.ring)}>
        <p className="text-xs font-semibold text-zinc-700">{title}</p>
        <p className="mt-1 text-[11px] text-zinc-500">Not on timeline</p>
      </div>
    );
  }

  const assigneeId = (task.assignedToId ?? task.assignedTo?.id) ?? "__none__";

  return (
    <div className={cn("rounded-xl border bg-white px-3 py-3 shadow-sm ring-1", accent.ring)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} aria-hidden />
          <p className={cn("truncate text-xs font-semibold", accent.text)}>{title}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-600">
        <span className="font-medium text-zinc-500">Status</span>
        <span className="font-semibold text-zinc-800">{sheetStatusLabel(task.status)}</span>
        <span className="text-zinc-300">·</span>
        <span className="font-medium text-zinc-500">Due</span>
        <span>{new Date(task.deadline).toLocaleDateString()}</span>
      </div>

      <div className="mt-2.5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {task.taskType === "DATA_COPY" ? "SPOC" : "Editor"}
        </p>
        {canAssign ? (
          <Select
            value={assigneeId}
            onValueChange={(v) => onAssign(task.id, v === "__none__" ? null : v)}
          >
            <SelectItem value="__none__">Unassigned</SelectItem>
            {assigneesForTeam(roster, task.assignedTeam).map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </Select>
        ) : (
          <p className="truncate text-sm font-medium text-zinc-900">{task.assignedTo?.name ?? "Unassigned"}</p>
        )}
      </div>
    </div>
  );
}

function WeddingAccordionCard({
  row,
  expanded,
  onToggle,
  mode,
  roster,
  onAssign,
}: {
  row: WeddingSheetRow;
  expanded: boolean;
  onToggle: () => void;
  mode: Mode;
  roster: User[];
  onAssign: (id: string, assignedToId: string | null) => void;
}) {
  const canAssign = mode === "coordinator";
  const { done, total } = rowProgress(row);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_2px_16px_-4px_rgba(15,23,42,0.08)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-zinc-50/80 sm:px-5"
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-cyan-50 text-violet-800 ring-1 ring-violet-100",
          )}
        >
          <Heart className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-900">{row.clientName}</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Event {row.eventDate ? new Date(row.eventDate).toLocaleDateString() : "—"}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Progress</p>
          <p className="text-sm font-semibold tabular-nums text-zinc-900">
            {done}/{total || "—"} done
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 min-w-[3rem] items-center justify-center rounded-full bg-violet-50 px-2 text-xs font-bold tabular-nums text-violet-800 ring-1 ring-violet-100">
            {pct}%
          </div>
          <ChevronDown
            className={cn("h-5 w-5 text-zinc-500 transition-transform duration-300", expanded && "rotate-180")}
            aria-hidden
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 bg-gradient-to-b from-zinc-50/80 to-white px-4 pb-5 pt-4 sm:px-5">
              <div className="mb-3 flex items-center justify-between sm:hidden">
                <span className="text-xs text-zinc-600">
                  {done}/{total} deliverables done
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {DELIVERABLE_GROUPS.map((group) => (
                  <DeliverableTile
                    key={group.taskType}
                    task={row.tasksByType.get(group.taskType)}
                    title={group.title}
                    team={group.team}
                    canAssign={canAssign}
                    roster={roster}
                    onAssign={onAssign}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function WeddingDeliverablesSheetTable({
  mode,
  tasks,
  roster,
  searchQuery,
  isLoading,
  dataUpdatedAt,
}: Props) {
  const qc = useQueryClient();
  const rows = useMemo(() => filterWeddingSheetRows(buildWeddingSheetRows(tasks), searchQuery), [tasks, searchQuery]);

  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (rows.length === 0) return;
    setOpen((prev) => {
      const next = { ...prev };
      let changed = false;
      if (rows[0] && next[rows[0].key] === undefined) {
        next[rows[0].key] = true;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [rows]);

  const assign = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: string; assignedToId: string | null }) => {
      const { data } = await api.put(`/tasks/${id}/assignee`, { assignedToId });
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["my-tasks"] });
      await qc.invalidateQueries({ queryKey: ["tasks", "admin-monitor"] });
      await qc.invalidateQueries({ queryKey: ["my-notifications"] });
      await qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">
        Loading weddings…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-14 text-center text-sm text-zinc-600">
        No weddings match yet. Add shoots and deliverable tasks from the calendar first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dataUpdatedAt ? (
        <p className="text-right text-[11px] text-zinc-500">
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()} · status changes when editors save on their login
        </p>
      ) : null}

      {rows.map((row) => (
        <WeddingAccordionCard
          key={row.key}
          row={row}
          expanded={Boolean(open[row.key])}
          onToggle={() => setOpen((s) => ({ ...s, [row.key]: !s[row.key] }))}
          mode={mode}
          roster={roster}
          onAssign={(id, assignedToId) => assign.mutate({ id, assignedToId })}
        />
      ))}
    </div>
  );
}
