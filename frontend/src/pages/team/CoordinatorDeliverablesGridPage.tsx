import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { api } from "@/services/api";
import type { Task, User } from "@/types/domain";
import { TaskStatus, Team } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

const DELIVERABLE_ORDER = [
  "DATA_COPY",
  "SNEAK_PEEK_PHOTOS",
  "PREVIEW_PHOTOS",
  "FULL_SET_PHOTOS",
  "FULL_PHOTOS",
  "CINEMATIC_HIGHLIGHT",
  "CINEMATIC_VIDEO",
  "ALBUM_DESIGN",
  "TRADITIONAL_VIDEO",
  "ALBUM_PRINT",
] as const;

function taskLabel(taskType: string) {
  return taskType.replaceAll("_", " ").toLowerCase().replace(/(^|\\s)\\w/g, (m) => m.toUpperCase());
}

function eventKey(t: Task) {
  return t.eventId || t.event?.id || t.id;
}

export function CoordinatorDeliverablesGridPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["production-calendar-roster"],
    queryFn: fetchRoster,
  });

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: TaskStatus }) => {
      const { data } = await api.put(`/tasks/${id}/status`, { status: next });
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["my-tasks"] });
      await qc.invalidateQueries({ queryKey: ["tasks", "admin-monitor"] });
      await qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  function assigneesForTeam(team: Team) {
    return roster.filter((u) => u.team === team || u.team === null);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tasks;
    return tasks.filter((t) => {
      const client = t.event?.clientName?.toLowerCase() ?? "";
      return client.includes(needle) || t.taskType.toLowerCase().includes(needle);
    });
  }, [tasks, q]);

  const events = useMemo(() => {
    const byEvent = new Map<string, Task[]>();
    for (const t of filtered) {
      const k = eventKey(t);
      byEvent.set(k, [...(byEvent.get(k) ?? []), t]);
    }

    const rows = Array.from(byEvent.entries()).map(([k, list]) => {
      const clientName = list[0]?.event?.clientName ?? "Wedding";
      const eventDate = list[0]?.event?.eventDate ?? null;
      const tasksByType = new Map(list.map((t) => [t.taskType, t]));
      return { key: k, clientName, eventDate, tasksByType, list };
    });

    return rows.sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Assignment control</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Deliverables grid</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
            This matches your sheet: Data Copy (SPOC), Sneak Peak, Full Set, Highlight, Album, Traditional, Album Print — assign each piece and track status live.
          </p>
          <Link to="/coordinator/shoot-calendar" className="skiper-link-accent mt-4 inline-flex text-sm font-medium text-amber-700">
            Open shoot calendar →
          </Link>
        </div>

        <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" shine>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input placeholder="Search client or deliverable…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[240px]" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <LayoutGrid className="h-4 w-4 text-amber-700" />
            <span>
              <span className="font-semibold text-zinc-900">{events.length}</span> weddings
            </span>
          </div>
        </GlassPanel>
      </div>

      {isLoading ? <GlassPanel className="p-10 text-center text-sm text-zinc-600">Loading deliverables…</GlassPanel> : null}

      {!isLoading && events.length === 0 ? (
        <GlassPanel className="p-14 text-center shine">
          <p className="text-sm font-medium text-zinc-900">No deliverables yet</p>
          <p className="mt-2 text-sm text-zinc-600">Create deliverables from the shoot calendar first.</p>
        </GlassPanel>
      ) : null}

      {!isLoading && events.length > 0 ? (
        <div className="space-y-6">
          {events.map((ev) => (
            <GlassPanel key={ev.key} shine className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-zinc-900">{ev.clientName}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    {ev.eventDate ? `Event date: ${new Date(ev.eventDate).toLocaleDateString()}` : "Event date: —"}
                  </div>
                </div>
                <div className="text-xs text-zinc-600">
                  {ev.list.filter((t) => t.status === TaskStatus.COMPLETED).length}/{ev.list.length} delivered
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {DELIVERABLE_ORDER.map((taskType) => {
                  const t = ev.tasksByType.get(taskType);
                  if (!t) return null;
                  const assigneeId = (t.assignedToId ?? t.assignedTo?.id) ?? "__none__";
                  return (
                    <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900">{taskLabel(t.taskType)}</div>
                          <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                            {t.assignedTeam.replaceAll("_", " ")}
                          </div>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>

                      <div className="mt-2 text-xs text-zinc-600">
                        Deadline: <span className="font-medium text-zinc-900">{new Date(t.deadline).toLocaleDateString()}</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Assign</div>
                        <Select value={assigneeId} onValueChange={(v) => assign.mutate({ id: t.id, assignedToId: v === "__none__" ? null : v })}>
                          <SelectItem value="__none__">Unassigned</SelectItem>
                          {assigneesForTeam(t.assignedTeam).map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="glass"
                          className={cn("rounded-xl")}
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.IN_PROGRESS })}
                        >
                          Mark in progress
                        </Button>
                        <Button
                          size="sm"
                          variant="premium"
                          className={cn("rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 shadow-glow-amber")}
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.COMPLETED })}
                        >
                          Mark done
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

