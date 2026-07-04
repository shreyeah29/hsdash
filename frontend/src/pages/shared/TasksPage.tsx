import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { AdminSurface } from "@/components/admin/AdminSurface";
import { StatusBadge } from "@/components/StatusBadge";
import { crewLiveQueryOptions } from "@/hooks/useCrewLiveData";
import { cn } from "@/lib/utils";

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

type FilterTab = "ALL" | "OPEN" | "DONE";

function taskTitle(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function deadlineLabel(iso: string) {
  const due = new Date(iso);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const date = due.toLocaleDateString();
  if (days < 0) return { date, hint: `${Math.abs(days)}d overdue` };
  if (days === 0) return { date, hint: "Due today" };
  if (days === 1) return { date, hint: "Due tomorrow" };
  return { date, hint: `In ${days} days` };
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === TaskStatus.COMPLETED ? 1 : 0;
    const bDone = b.status === TaskStatus.COMPLETED ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return +new Date(a.deadline) - +new Date(b.deadline);
  });
}

export function TasksPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<FilterTab>("OPEN");

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: fetchTasks,
    ...crewLiveQueryOptions,
  });

  const filtered = useMemo(() => {
    const tasks = data ?? [];
    const needle = q.trim().toLowerCase();
    return sortTasks(
      tasks.filter((t) => {
        const matchesQ =
          !needle ||
          t.taskType.toLowerCase().includes(needle) ||
          t.event?.clientName?.toLowerCase().includes(needle);
        const matchesTab =
          tab === "ALL" ||
          (tab === "OPEN" && t.status !== TaskStatus.COMPLETED) ||
          (tab === "DONE" && t.status === TaskStatus.COMPLETED);
        return matchesQ && matchesTab;
      }),
    );
  }, [data, q, tab]);

  const counts = useMemo(() => {
    const tasks = data ?? [];
    return {
      all: tasks.length,
      open: tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length,
      done: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    };
  }, [data]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: TaskStatus }) => {
      const { data } = await api.put(`/tasks/${id}/status`, { status: next });
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["tasks", "admin-monitor"] });
      await qc.invalidateQueries({ queryKey: ["my-tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  return (
    <div className="space-y-6">
      <p className="admin-display-subtitle text-sm">Your assigned deliverables — update status when you start or finish.</p>

      <AdminSurface className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <label className="admin-kicker" htmlFor="task-search">
            Search
          </label>
          <input
            id="task-search"
            className="mt-2 w-full border-2 border-black px-3 py-2 text-sm font-medium"
            placeholder="Search wedding…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["OPEN", "Open", counts.open],
              ["DONE", "Done", counts.done],
              ["ALL", "All", counts.all],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn("admin-tab", tab === key && "admin-tab--active")}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </AdminSurface>

      {dataUpdatedAt ? (
        <p className="text-right text-[11px] font-semibold uppercase tracking-wider text-black/60">
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      ) : null}

      {isLoading ? <p className="admin-display-subtitle">Loading your tasks…</p> : null}
      {error ? (
        <AdminSurface>
          <p className="admin-display-subtitle text-red-700">Failed to load tasks.</p>
        </AdminSurface>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <AdminSurface>
          <p className="admin-display-title text-lg">Nothing here</p>
          <p className="admin-display-subtitle mt-2 text-sm">
            {tab === "OPEN" ? "No open tasks — check Done or wait for new assignments." : "No tasks match this filter."}
          </p>
        </AdminSurface>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <AdminSurface className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-white text-[11px] font-bold uppercase tracking-[0.12em] text-black">
                  <th className="px-4 py-3">Wedding</th>
                  <th className="px-4 py-3">Deliverable</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const done = t.status === TaskStatus.COMPLETED;
                  const due = deadlineLabel(t.deadline);
                  const inProgress = t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.DELAYED;

                  return (
                    <tr key={t.id} className={cn("border-b-2 border-black/10 last:border-0", done && "opacity-70")}>
                      <td className="px-4 py-3.5 font-semibold text-black">{t.event?.clientName ?? "—"}</td>
                      <td className="px-4 py-3.5 text-black">{taskTitle(t.taskType)}</td>
                      <td className="px-4 py-3.5">
                        <div className="tabular-nums text-black">{due.date}</div>
                        <div className="text-[11px] font-semibold text-black/60">{due.hint}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {done ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-black">
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                            Completed
                          </span>
                        ) : inProgress ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn--solid !px-3 !py-1.5 text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.COMPLETED })}
                          >
                            Mark done
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn !px-3 !py-1.5 text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.IN_PROGRESS })}
                          >
                            Start
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminSurface>
      ) : null}
    </div>
  );
}
