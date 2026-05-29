import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Task, Team, User } from "@/types/domain";
import {
  WEDDING_DELIVERABLES_SHEET_COLUMNS,
  buildWeddingSheetRows,
  filterWeddingSheetRows,
  sheetStatusLabel,
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

export function WeddingDeliverablesSheetTable({
  mode,
  tasks,
  roster,
  searchQuery,
  isLoading,
  dataUpdatedAt,
}: Props) {
  const qc = useQueryClient();
  const canAssign = mode === "coordinator";

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

  const rows = useMemo(() => filterWeddingSheetRows(buildWeddingSheetRows(tasks), searchQuery), [tasks, searchQuery]);

  if (isLoading) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">Loading sheet…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-14 text-center text-sm text-zinc-600">
        No weddings match yet. Add shoots and deliverable tasks from the calendar first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dataUpdatedAt ? (
        <p className="text-right text-[11px] text-zinc-500">
          Last updated {new Date(dataUpdatedAt).toLocaleTimeString()} · editors update status on their dashboards
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="sticky left-0 z-20 min-w-[200px] border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Wedding
                </th>
                <th className="min-w-[108px] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  Event date
                </th>
                {WEDDING_DELIVERABLES_SHEET_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "min-w-[132px] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-600",
                      col.kind === "status" && "min-w-[118px]",
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={row.key}
                  className={cn("border-b border-zinc-100", rowIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/40")}
                >
                  <td className="sticky left-0 z-10 border-r border-zinc-100 bg-inherit px-4 py-3 font-semibold text-zinc-900">
                    {row.clientName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                    {row.eventDate ? new Date(row.eventDate).toLocaleDateString() : "—"}
                  </td>
                  {WEDDING_DELIVERABLES_SHEET_COLUMNS.map((col) => {
                    const task = row.tasksByType.get(col.taskType);
                    if (!task) {
                      return (
                        <td key={col.id} className="px-3 py-3 text-center text-zinc-400">
                          —
                        </td>
                      );
                    }

                    if (col.kind === "status") {
                      return (
                        <td key={col.id} className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={task.status} />
                            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                              {sheetStatusLabel(task.status)}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    const assigneeId = (task.assignedToId ?? task.assignedTo?.id) ?? "__none__";
                    const name = task.assignedTo?.name;

                    if (canAssign) {
                      return (
                        <td key={col.id} className="px-3 py-3">
                          <Select
                            value={assigneeId}
                            onValueChange={(v) =>
                              assign.mutate({ id: task.id, assignedToId: v === "__none__" ? null : v })
                            }
                          >
                            <SelectItem value="__none__">Unassigned</SelectItem>
                            {assigneesForTeam(roster, task.assignedTeam).map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className="px-3 py-3 font-medium text-zinc-800">
                        {name ?? <span className="text-zinc-400">Unassigned</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
