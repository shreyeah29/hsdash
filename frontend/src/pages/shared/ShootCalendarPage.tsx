import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localDayKey(y: number, monthIndex: number, day: number) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function calendarDayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function monthRangeIso(y: number, monthIndex: number) {
  const last = new Date(y, monthIndex + 1, 0);
  return { from: localDayKey(y, monthIndex, 1), to: localDayKey(y, monthIndex, last.getDate()) };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string })?.message;
    if (typeof msg === "string") return msg;
    return e.message;
  }
  return "Something went wrong.";
}

async function fetchEntries(from: string, to: string) {
  const { data } = await api.get<{ entries: ShootCalendarEntry[] }>("/production-calendar/entries", {
    params: { from, to },
  });
  return data.entries;
}

type FormState = {
  day: string;
  clientName: string;
  clientType: string;
  eventName: string;
  venue: string;
  startTime: string;
  endTime: string;
  photoTeam: string;
  videoTeam: string;
  addons: string;
  createDeliverableTimeline: boolean;
};

const emptyForm = (day: string): FormState => ({
  day,
  clientName: "",
  clientType: "",
  eventName: "",
  venue: "",
  startTime: "",
  endTime: "",
  photoTeam: "",
  videoTeam: "",
  addons: "",
  createDeliverableTimeline: false,
});

export type ShootCalendarMode = "admin" | "coordinator";

/** Shoot operations calendar — admin edits logistics; coordinator reviews and unlocks post-production. */
export function ShootCalendarPage({ mode }: { mode: ShootCalendarMode }) {
  const canMutate = mode === "admin";
  const coordinatorMode = mode === "coordinator";
  const qc = useQueryClient();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const { from, to } = monthRangeIso(cursor.y, cursor.m);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["production-calendar-entries", from, to],
    queryFn: () => fetchEntries(from, to),
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(localDayKey(now.getFullYear(), now.getMonth(), now.getDate())));

  const grid = useMemo(() => {
    const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { day: number | null }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [cursor.y, cursor.m]);

  const entriesByDay = useMemo(() => {
    const m = new Map<string, ShootCalendarEntry[]>();
    for (const e of entries) {
      const k = calendarDayKeyFromIso(e.day);
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [entries]);

  const duesInMonth = useMemo(() => {
    const m = new Map<string, { task: Task; clientName: string }[]>();
    for (const e of entries) {
      if (!e.event?.tasks) continue;
      for (const t of e.event.tasks) {
        const dk = calendarDayKeyFromIso(t.deadline);
        if (dk < from || dk > to) continue;
        const arr = m.get(dk) ?? [];
        arr.push({ task: t, clientName: e.clientName });
        m.set(dk, arr);
      }
    }
    return m;
  }, [entries, from, to]);

  const selectedEntries = selectedKey ? entriesByDay.get(selectedKey) ?? [] : [];
  const selectedDues = selectedKey ? duesInMonth.get(selectedKey) ?? [] : [];

  const saveEntry = useMutation({
    mutationFn: async () => {
      const payload = {
        day: form.day,
        clientName: form.clientName,
        clientType: form.clientType,
        eventName: form.eventName,
        venue: form.venue,
        startTime: form.startTime,
        endTime: form.endTime,
        photoTeam: form.photoTeam,
        videoTeam: form.videoTeam,
        addons: form.addons,
        ...(form.createDeliverableTimeline ? { createDeliverableTimeline: true } : {}),
      };
      if (editingId && editingId !== "new") {
        const { data } = await api.put(`/production-calendar/entries/${editingId}`, payload);
        return data;
      }
      const { data } = await api.post("/production-calendar/entries", {
        ...payload,
        createDeliverableTimeline: form.createDeliverableTimeline,
      });
      return data;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditingId(null);
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/production-calendar/entries/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const startPostProduction = useMutation({
    mutationFn: async (entryId: string) => {
      const { data } = await api.post<{ entry: ShootCalendarEntry }>(
        `/production-calendar/entries/${entryId}/start-post-production`,
      );
      return data.entry;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  const timelineAlreadyLinked =
    editingId && editingId !== "new" ? entries.some((x) => x.id === editingId && !!x.eventId) : false;

  function openNew() {
    if (!canMutate || !selectedKey) return;
    setEditingId("new");
    setForm(emptyForm(selectedKey));
    setDialogOpen(true);
  }

  function openEdit(entry: ShootCalendarEntry) {
    if (!canMutate) return;
    setEditingId(entry.id);
    setForm({
      day: calendarDayKeyFromIso(entry.day),
      clientName: entry.clientName,
      clientType: entry.clientType,
      eventName: entry.eventName,
      venue: entry.venue ?? "",
      startTime: entry.startTime,
      endTime: entry.endTime,
      photoTeam: entry.photoTeam,
      videoTeam: entry.videoTeam,
      addons: entry.addons,
      createDeliverableTimeline: !entry.eventId,
    });
    setDialogOpen(true);
  }

  const assignmentsLink = coordinatorMode ? "/coordinator/assignments" : "/team/tasks";

  const surfaceMuted = coordinatorMode ? "text-zinc-600" : "text-zinc-600";
  const heading = "text-zinc-900";

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Shoot logistics</p>
        <h1 className={cn("text-3xl font-semibold tracking-tight md:text-4xl", heading)}>Production calendar</h1>
        <p className={cn("text-sm leading-relaxed md:text-[15px]", surfaceMuted)}>
          {canMutate ? (
            <>
              Log shoot-day logistics only — client intel, timings, venue, attending crews, notes. After the wedding wraps, Emmanuel starts
              post-production tasks from his dashboard (not here). Optional shortcut: tick below to seed standard deadlines immediately (most teams wait for Emmanuel).
            </>
          ) : (
            <>
              Read-only logistics mirror what Admin captured. After the shoot, use{" "}
              <span className="font-medium text-amber-700">Start post-production</span> on each completed row to spawn editing tasks, then assign editors in{" "}
              <Link className="font-medium text-amber-700 underline" to={assignmentsLink}>
                Assignments
              </Link>
              .
            </>
          )}
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(320px,400px)]">
        <GlassPanel shine className="overflow-hidden p-6 md:p-8">
          <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">{label}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isLoading ? "Loading…" : canMutate ? "Select cells to orchestrate shoot logistics." : "Review admin-logged coverage."}
              </p>
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
          <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
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
              const list = entriesByDay.get(key) ?? [];
              const dueN = duesInMonth.get(key)?.length ?? 0;
              const isToday = key === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
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
                    <span className="flex gap-1">
                      {list.length > 0 ? (
                        <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" title="Shoot" />
                      ) : null}
                      {dueN > 0 ? (
                        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]" title="Due" />
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {list.slice(0, 2).map((e) => (
                      <div key={e.id} className="truncate text-zinc-600" title={e.clientName}>
                        {e.clientName}
                      </div>
                    ))}
                    {list.length > 2 ? <div className="text-zinc-600">+{list.length - 2}</div> : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-5 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400" /> Shoot logged
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Deliverable deadline
            </span>
          </div>
        </GlassPanel>

        <motion.div layout className="xl:sticky xl:top-6 xl:self-start">
          <GlassPanel className="space-y-6 p-6 md:p-8">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">{selectedKey ?? "Select a day"}</h2>
              <p className="mt-1 text-sm text-zinc-500">Shoot intel & linked deliverable milestones.</p>
            </div>
            <div className="space-y-4">
            {!selectedKey ? (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-14 text-center text-sm text-zinc-500">
                Select a date on the calendar to reveal logistics & timelines.
              </p>
            ) : (
              <>
                {canMutate ? (
                  <Button type="button" variant="premium" className="w-full rounded-xl py-6" onClick={openNew}>
                    Add shoot / event details
                  </Button>
                ) : null}

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Logged shoots</div>
                  <div className="space-y-3">
                    {selectedEntries.map((e) => (
                      <div
                        key={e.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 shadow-sm"
                      >
                        <div className="font-semibold text-zinc-900">{e.clientName}</div>
                        {e.eventName ? <div className="text-zinc-400">{e.eventName}</div> : null}
                        <div className="mt-2 space-y-0.5 text-xs text-zinc-500">
                          {e.clientType ? <div>Type: {e.clientType}</div> : null}
                          {e.venue ? <div>Venue: {e.venue}</div> : null}
                          {(e.startTime || e.endTime) && (
                            <div>
                              Time: {e.startTime || "—"} – {e.endTime || "—"}
                            </div>
                          )}
                          {e.photoTeam ? <div className="whitespace-pre-wrap">Photo on-site: {e.photoTeam}</div> : null}
                          {e.videoTeam ? <div className="whitespace-pre-wrap">Video on-site: {e.videoTeam}</div> : null}
                          {e.addons ? <div className="whitespace-pre-wrap">Notes: {e.addons}</div> : null}
                          <div className="text-[11px] text-zinc-600">Recorded by {e.createdBy.name}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {e.eventId ? (
                            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                              Post-production active
                            </span>
                          ) : (
                            <span className="rounded-lg border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-600">
                              Awaiting coordinator kickoff
                            </span>
                          )}
                          {coordinatorMode && !e.eventId ? (
                            <Button
                              size="sm"
                              type="button"
                              variant="premium"
                              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-glow-amber hover:brightness-105"
                              disabled={startPostProduction.isPending}
                              onClick={() => startPostProduction.mutate(e.id)}
                            >
                              Start post-production
                            </Button>
                          ) : null}
                          {canMutate ? (
                            <>
                              <Button variant="glass" size="sm" type="button" className="rounded-xl" onClick={() => openEdit(e)}>
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                                disabled={deleteEntry.isPending}
                                onClick={() => deleteEntry.mutate(e.id)}
                              >
                                Delete
                              </Button>
                            </>
                          ) : null}
                        </div>
                        {startPostProduction.isError ? (
                          <p className="mt-2 text-xs text-rose-600">{errMsg(startPostProduction.error)}</p>
                        ) : null}
                      </div>
                    ))}
                    {selectedEntries.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center text-sm text-zinc-500">
                        {canMutate ? "Nothing logged for this day yet." : "Nothing logged for this day."}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Deliverables due this day</div>
                  {selectedDues.length === 0 ? (
                    <p className="text-sm text-zinc-500">No linked deadlines on this date.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {selectedDues.map(({ task: t, clientName }) => (
                        <li
                          key={t.id}
                          className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-transparent px-4 py-3 text-zinc-800"
                        >
                          <span className="font-medium text-zinc-900">{clientName}</span>{" "}
                          <span className="text-zinc-500">—</span> {t.taskType.replaceAll("_", " ")}
                          {t.assignedTo ? <span className="text-zinc-500"> · {t.assignedTo.name}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {canMutate ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId === "new" ? "Add shoot details" : "Edit shoot details"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Day</div>
                <Input type="date" value={form.day} onChange={(ev) => setForm((f) => ({ ...f, day: ev.target.value }))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Client name</div>
                <Input
                  value={form.clientName}
                  onChange={(ev) => setForm((f) => ({ ...f, clientName: ev.target.value }))}
                  placeholder="e.g. Rahul & Priya"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">Type of client</div>
                <Input value={form.clientType} onChange={(ev) => setForm((f) => ({ ...f, clientType: ev.target.value }))} placeholder="Wedding, corporate…" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">Event name</div>
                <Input value={form.eventName} onChange={(ev) => setForm((f) => ({ ...f, eventName: ev.target.value }))} placeholder="Reception, ceremony…" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Venue</div>
                <Input value={form.venue} onChange={(ev) => setForm((f) => ({ ...f, venue: ev.target.value }))} placeholder="Ceremony / reception location" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">Start time</div>
                <Input value={form.startTime} onChange={(ev) => setForm((f) => ({ ...f, startTime: ev.target.value }))} placeholder="10:00 AM" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-400">End time</div>
                <Input value={form.endTime} onChange={(ev) => setForm((f) => ({ ...f, endTime: ev.target.value }))} placeholder="6:00 PM" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Photo team (on-site)</div>
                <textarea
                  className={cn("premium-field min-h-[72px] w-full resize-y")}
                  value={form.photoTeam}
                  onChange={(ev) => setForm((f) => ({ ...f, photoTeam: ev.target.value }))}
                  placeholder="Names / crew going"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Video team (on-site)</div>
                <textarea
                  className={cn("premium-field min-h-[72px] w-full resize-y")}
                  value={form.videoTeam}
                  onChange={(ev) => setForm((f) => ({ ...f, videoTeam: ev.target.value }))}
                  placeholder="Names / crew going"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs font-medium text-zinc-400">Notes / add-ons</div>
                <textarea
                  className={cn("premium-field min-h-[72px] w-full resize-y")}
                  value={form.addons}
                  onChange={(ev) => setForm((f) => ({ ...f, addons: ev.target.value }))}
                  placeholder="Anything extra to remember"
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 bg-white text-violet-600 focus:ring-violet-500/40"
                  checked={timelineAlreadyLinked ? false : form.createDeliverableTimeline}
                  disabled={timelineAlreadyLinked}
                  onChange={(ev) => setForm((f) => ({ ...f, createDeliverableTimeline: ev.target.checked }))}
                />
                <span className="text-sm leading-snug text-zinc-700">
                  Immediately seed standard deliverable deadlines (preview +7d, full photos +20d, videos +30/+45d, album +45d). Leave off if Emmanuel should create tasks after the shoot.
                  {timelineAlreadyLinked ? (
                    <span className="mt-1 block text-xs text-zinc-500">This row already has a linked timeline.</span>
                  ) : null}
                </span>
              </label>
            </div>
            {saveEntry.isError ? <p className="mt-2 text-sm text-rose-600">{errMsg(saveEntry.error)}</p> : null}
            <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
              <Button type="button" variant="glass" className="rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="premium"
                className="rounded-xl"
                disabled={saveEntry.isPending || !form.clientName.trim()}
                onClick={() => saveEntry.mutate()}
              >
                {saveEntry.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
