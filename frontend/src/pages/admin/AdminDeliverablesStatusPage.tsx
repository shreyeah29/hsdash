import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { PriorityShowcaseCard } from "@/components/premium/PriorityShowcaseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";

async function fetchAllTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

const COLUMNS: { key: TaskStatus; label: string; blurb: string; tint: string }[] = [
  { key: TaskStatus.PENDING, label: "Awaiting pickup", blurb: "Routing pending", tint: "from-violet-50 to-transparent" },
  {
    key: TaskStatus.IN_PROGRESS,
    label: "Live production",
    blurb: "Teams executing",
    tint: "from-cyan-50 to-transparent",
  },
  { key: TaskStatus.DELAYED, label: "Escalations", blurb: "Needs visibility", tint: "from-rose-50 to-transparent" },
  {
    key: TaskStatus.COMPLETED,
    label: "Closed loops",
    blurb: "Delivered beautifully",
    tint: "from-emerald-50 to-transparent",
  },
];

/** Read-only mission monitor — coordinators own routing; admins watch momentum. */
export function AdminDeliverablesStatusPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const { data, isLoading, error } = useQuery({
    queryKey: ["tasks", "admin-monitor"],
    queryFn: fetchAllTasks,
  });

  const filtered = useMemo(() => {
    const tasks = data ?? [];
    return tasks.filter((t) => {
      const matchesQ =
        !q ||
        t.taskType.toLowerCase().includes(q.toLowerCase()) ||
        t.event?.clientName?.toLowerCase().includes(q.toLowerCase()) ||
        t.assignedTo?.name?.toLowerCase().includes(q.toLowerCase());
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

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Operations radar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Deliverables status</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Monitor deadlines, seating, and momentum studio-wide. Assignment moves happen in the coordinator console — this board stays pristine for leadership visibility.
          </p>
        </div>

        <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" shine>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input placeholder="Search client, task, or editor…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[220px]" />
            <Select value={status} onValueChange={setStatus}>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In progress</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
            <Radar className="h-4 w-4 text-violet-600" />
            <span>
              <span className="font-semibold text-zinc-900">{filtered.length}</span> live signals
            </span>
          </div>
        </GlassPanel>
      </div>

      {isLoading ? (
        <GlassPanel className="p-10 text-center text-sm text-zinc-400">Pulling studio telemetry…</GlassPanel>
      ) : null}
      {error ? (
        <GlassPanel className="border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">Failed to load deliverables.</GlassPanel>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <p className="text-sm font-medium text-zinc-900">No matching deliverables</p>
          <p className="mt-2 text-sm text-zinc-500">Adjust filters or sync with coordinators on incoming timelines.</p>
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
                    <div className="text-[11px] text-zinc-500">{col.blurb}</div>
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
                    metaRow={
                      <p className="text-[11px] text-zinc-500">
                        <span className="font-medium text-zinc-600">{t.assignedTeam.replaceAll("_", " ")}</span>
                        {" · "}
                        <span className="text-zinc-800">{t.assignedTo?.name ?? "Unassigned"}</span>
                        {" · "}
                        <span className="tabular-nums">{new Date(t.deadline).toLocaleDateString()}</span>
                      </p>
                    }
                    topTrailing={<StatusBadge status={t.status} />}
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
