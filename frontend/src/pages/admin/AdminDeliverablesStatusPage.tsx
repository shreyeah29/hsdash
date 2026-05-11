import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Radar, TriangleAlert } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";

async function fetchAllTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

function taskLabel(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}

function daysUntil(isoOrDate: string) {
  const due = new Date(isoOrDate);
  const start = new Date();
  const ms = due.getTime() - start.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

type WeddingRow = {
  eventId: string;
  clientName: string;
  eventDate: string | null;
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  nextDue: string | null;
  overdueCount: number;
  delayedCount: number;
  uniqueEditors: string[];
};

/** Read-only mission monitor — coordinators own routing; admins watch momentum. */
export function AdminDeliverablesStatusPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [open, setOpen] = useState<Record<string, boolean>>({});

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

  const weddings = useMemo((): WeddingRow[] => {
    const byEvent = new Map<string, Task[]>();
    for (const t of filtered) {
      const eventId = t.eventId || t.event?.id;
      if (!eventId) continue;
      byEvent.set(eventId, [...(byEvent.get(eventId) ?? []), t]);
    }

    const rows: WeddingRow[] = [];
    for (const [eventId, tasks] of byEvent.entries()) {
      const clientName = tasks[0]?.event?.clientName ?? "Wedding";
      const eventDate = tasks[0]?.event?.eventDate ?? null;

      const totalCount = tasks.length;
      const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      const delayedCount = tasks.filter((t) => t.status === TaskStatus.DELAYED).length;
      const overdueCount = tasks.filter((t) => {
        if (t.status === TaskStatus.COMPLETED) return false;
        return new Date(t.deadline).getTime() < Date.now();
      }).length;

      const nextDueTask = [...tasks]
        .filter((t) => t.status !== TaskStatus.COMPLETED)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

      const uniqueEditors = Array.from(
        new Set(tasks.map((t) => t.assignedTo?.name).filter((x): x is string => Boolean(x))),
      );

      rows.push({
        eventId,
        clientName,
        eventDate,
        tasks: [...tasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
        completedCount,
        totalCount,
        nextDue: nextDueTask?.deadline ?? null,
        overdueCount,
        delayedCount,
        uniqueEditors,
      });
    }

    return rows.sort((a, b) => {
      const aRisk = a.overdueCount + a.delayedCount;
      const bRisk = b.overdueCount + b.delayedCount;
      if (aRisk !== bRisk) return bRisk - aRisk;
      const aNext = a.nextDue ? new Date(a.nextDue).getTime() : Number.POSITIVE_INFINITY;
      const bNext = b.nextDue ? new Date(b.nextDue).getTime() : Number.POSITIVE_INFINITY;
      return aNext - bNext;
    });
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Operations radar</p>
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
              <span className="font-semibold text-zinc-900">{weddings.length}</span> weddings
            </span>
          </div>
        </GlassPanel>
      </div>

      {isLoading ? (
        <GlassPanel className="p-10 text-center text-sm text-zinc-600">Pulling studio telemetry…</GlassPanel>
      ) : null}
      {error ? (
        <GlassPanel className="border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">Failed to load deliverables.</GlassPanel>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <p className="text-sm font-medium text-zinc-900">No matching deliverables</p>
          <p className="mt-2 text-sm text-zinc-600">Adjust filters or sync with coordinators on incoming timelines.</p>
        </GlassPanel>
      ) : null}

      {!isLoading && weddings.length > 0 ? (
        <GlassPanel className="overflow-hidden p-0" shine>
          <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
            <div className="grid grid-cols-[28px_1.4fr_0.9fr_0.8fr_0.8fr_1fr] items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
              <div />
              <div>Wedding</div>
              <div>Event date</div>
              <div>Progress</div>
              <div>Next due</div>
              <div>Editors</div>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {weddings.map((w) => {
              const expanded = Boolean(open[w.eventId]);
              const progressPct = w.totalCount ? Math.round((w.completedCount / w.totalCount) * 100) : 0;
              const risk = w.overdueCount + w.delayedCount;
              const nextDueDays = w.nextDue ? daysUntil(w.nextDue) : null;

              return (
                <div key={w.eventId} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setOpen((s) => ({ ...s, [w.eventId]: !s[w.eventId] }))}
                    className="grid w-full grid-cols-[28px_1.4fr_0.9fr_0.8fr_0.8fr_1fr] items-center gap-3 px-5 py-4 text-left hover:bg-zinc-50"
                  >
                    <div className="text-zinc-500">
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold text-zinc-900">{w.clientName}</div>
                        {risk > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                            <TriangleAlert className="h-3.5 w-3.5" />
                            {risk} risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            On track
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">{w.totalCount} deliverables</div>
                    </div>

                    <div className="text-sm text-zinc-700">
                      {w.eventDate ? new Date(w.eventDate).toLocaleDateString() : "—"}
                    </div>

                    <div className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900">{w.completedCount}</span>/{w.totalCount}
                      <span className="ml-2 text-xs text-zinc-600">{progressPct}%</span>
                    </div>

                    <div className="text-sm text-zinc-700">
                      {w.nextDue ? (
                        <div className="space-y-0.5">
                          <div className="tabular-nums font-medium text-zinc-900">{new Date(w.nextDue).toLocaleDateString()}</div>
                          <div className="text-xs text-zinc-600">
                            {nextDueDays !== null ? (nextDueDays < 0 ? `${Math.abs(nextDueDays)}d overdue` : `in ${nextDueDays}d`) : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>

                    <div className="min-w-0 text-sm text-zinc-700">
                      {w.uniqueEditors.length > 0 ? (
                        <span className="truncate">{w.uniqueEditors.join(", ")}</span>
                      ) : (
                        <span className="text-zinc-600">Unassigned</span>
                      )}
                    </div>
                  </button>

                  {expanded ? (
                    <div className="bg-zinc-50 px-5 pb-5">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="grid grid-cols-[1.2fr_0.9fr_0.7fr_1fr_0.9fr] items-center gap-3 border-b border-zinc-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                          <div>Deliverable</div>
                          <div>Team</div>
                          <div>Status</div>
                          <div>Editor</div>
                          <div>Deadline</div>
                        </div>
                        <div className="divide-y divide-zinc-100">
                          {w.tasks.map((t) => (
                            <div key={t.id} className="grid grid-cols-[1.2fr_0.9fr_0.7fr_1fr_0.9fr] items-center gap-3 py-3 text-sm">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-zinc-900">{taskLabel(t.taskType)}</div>
                                <div className="mt-0.5 text-xs text-zinc-600">{t.priority.toLowerCase()}</div>
                              </div>
                              <div className="text-zinc-700">{t.assignedTeam.replaceAll("_", " ")}</div>
                              <div>
                                <StatusBadge status={t.status} />
                              </div>
                              <div className="min-w-0 text-zinc-700">{t.assignedTo?.name ?? "Unassigned"}</div>
                              <div className="tabular-nums text-zinc-700">{new Date(t.deadline).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </GlassPanel>
      ) : null}
    </motion.div>
  );
}
