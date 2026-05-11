import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LayoutList } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { PriorityShowcaseCard } from "@/components/premium/PriorityShowcaseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

const COLUMNS: { key: TaskStatus; label: string; blurb: string; tint: string }[] = [
  { key: TaskStatus.PENDING, label: "Queued", blurb: "Ready to pick up", tint: "from-zinc-100 to-transparent" },
  {
    key: TaskStatus.IN_PROGRESS,
    label: "In motion",
    blurb: "Active craft time",
    tint: "from-cyan-50 to-transparent",
  },
  { key: TaskStatus.DELAYED, label: "Needs air cover", blurb: "Unblock or reset", tint: "from-rose-50 to-transparent" },
  {
    key: TaskStatus.COMPLETED,
    label: "Shipped",
    blurb: "Delivered momentum",
    tint: "from-emerald-50 to-transparent",
  },
];

export function TasksPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const filtered = useMemo(() => {
    const tasks = data ?? [];
    return tasks.filter((t) => {
      const matchesQ =
        !q ||
        t.taskType.toLowerCase().includes(q.toLowerCase()) ||
        t.event?.clientName?.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "ALL" ? true : t.status === status;
      return matchesQ && matchesStatus;
    });
  }, [data, q, status]);

  const grouped = useMemo(() => {
    const buckets: Record<TaskStatus, Task[]> = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.DELAYED]: [],
    };
    for (const t of filtered) {
      buckets[t.status].push(t);
    }
    return buckets;
  }, [filtered]);

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
    },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Workflow</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Your queue</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
            Assignments routed to you — move cards forward as you progress. Everything stays cinematic, nothing feels like a spreadsheet.
          </p>
        </div>
        <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" shine>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input placeholder="Search client or deliverable…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[200px]" />
            <Select value={status} onValueChange={setStatus}>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In progress</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            <LayoutList className="h-4 w-4 text-violet-600" />
            <span>
              <span className="font-semibold text-zinc-900">{filtered.length}</span> visible
            </span>
          </div>
        </GlassPanel>
      </div>

      {isLoading ? (
        <GlassPanel className="p-10 text-center text-sm text-zinc-600">Loading your board…</GlassPanel>
      ) : null}
      {error ? (
        <GlassPanel className="border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">Failed to load tasks.</GlassPanel>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <p className="text-sm font-medium text-zinc-900">You&apos;re clear</p>
          <p className="mt-2 text-sm text-zinc-600">No tasks match these filters — check back after coordinators route new work.</p>
        </GlassPanel>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
      <div className="grid gap-5 xl:grid-cols-4">
        {COLUMNS.map((col, colIdx) => {
          const list = grouped[col.key];
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex min-h-[280px] flex-col rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 p-4 shadow-sm"
            >
              <div className={`mb-4 rounded-xl bg-gradient-to-r px-3 py-3 ${col.tint}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-semibold text-zinc-900">{col.label}</div>
                    <div className="text-[11px] text-zinc-600">{col.blurb}</div>
                  </div>
                  <span className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-700">
                    {list.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {list.map((t, rowIdx) => (
                    <PriorityShowcaseCard
                      key={t.id}
                      task={t}
                      index={colIdx * 24 + rowIdx}
                      topTrailing={<StatusBadge status={t.status} />}
                      footer={
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="glass"
                            className="rounded-xl"
                            disabled={updateStatus.isPending || t.status === TaskStatus.PENDING}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.PENDING })}
                          >
                            Queue
                          </Button>
                          <Button
                            size="sm"
                            variant="glass"
                            className="rounded-xl"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.IN_PROGRESS })}
                          >
                            In progress
                          </Button>
                          <Button
                            size="sm"
                            variant="premium"
                            className="rounded-xl"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.COMPLETED })}
                          >
                            Complete
                          </Button>
                        </div>
                      }
                    />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      ) : null}
    </motion.div>
  );
}
