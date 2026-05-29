import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, ListTodo } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
  if (days < 0) return { date, hint: `${Math.abs(days)}d overdue`, tone: "rose" as const };
  if (days === 0) return { date, hint: "Due today", tone: "amber" as const };
  if (days === 1) return { date, hint: "Due tomorrow", tone: "amber" as const };
  return { date, hint: `In ${days} days`, tone: "zinc" as const };
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">My tasks</h1>
          <p className="mt-1 text-sm text-zinc-600">Your assigned deliverables — update status when you start or finish.</p>
        </div>
        <GlassPanel className="flex flex-wrap items-center gap-3 p-3" shine>
          <Input placeholder="Search wedding…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[200px]" />
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
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
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>

      {dataUpdatedAt ? (
        <p className="text-right text-[11px] text-zinc-500">Updated {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
      ) : null}

      {isLoading ? (
        <GlassPanel className="p-10 text-center text-sm text-zinc-600">Loading your tasks…</GlassPanel>
      ) : null}
      {error ? (
        <GlassPanel className="border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">Failed to load tasks.</GlassPanel>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <ListTodo className="mx-auto h-8 w-8 text-zinc-400" />
          <p className="mt-3 text-sm font-medium text-zinc-900">Nothing here</p>
          <p className="mt-1 text-sm text-zinc-600">
            {tab === "OPEN" ? "No open tasks — check Done or wait for new assignments." : "No tasks match this filter."}
          </p>
        </GlassPanel>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <GlassPanel className="overflow-hidden p-0" shine>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                  <th className="px-4 py-3">Wedding</th>
                  <th className="px-4 py-3">Deliverable</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const done = t.status === TaskStatus.COMPLETED;
                  const due = deadlineLabel(t.deadline);
                  const inProgress = t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.DELAYED;

                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        "border-b border-zinc-100 last:border-0",
                        i % 2 === 0 ? "bg-white" : "bg-zinc-50/50",
                        done && "opacity-75",
                      )}
                    >
                      <td className="px-4 py-3.5 font-medium text-zinc-900">{t.event?.clientName ?? "—"}</td>
                      <td className="px-4 py-3.5 text-zinc-800">{taskTitle(t.taskType)}</td>
                      <td className="px-4 py-3.5">
                        <div className="tabular-nums text-zinc-900">{due.date}</div>
                        <div
                          className={cn(
                            "text-[11px] font-medium",
                            due.tone === "rose" && "text-rose-700",
                            due.tone === "amber" && "text-amber-700",
                            due.tone === "zinc" && "text-zinc-500",
                          )}
                        >
                          {due.hint}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {done ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                            Completed
                          </span>
                        ) : inProgress ? (
                          <Button
                            size="sm"
                            variant="premium"
                            className="h-8 rounded-lg px-4 text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.COMPLETED })}
                          >
                            Mark done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg px-4 text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.IN_PROGRESS })}
                          >
                            Start
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : null}
    </motion.div>
  );
}
