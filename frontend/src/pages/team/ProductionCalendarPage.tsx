import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/services/api";
import type { ShootCalendarEntry, Task } from "@/types/domain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
  startTime: "",
  endTime: "",
  photoTeam: "",
  videoTeam: "",
  addons: "",
  createDeliverableTimeline: true,
});

export function ProductionCalendarPage() {
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
      if (editingId && editingId !== "new") {
        const { data } = await api.put(`/production-calendar/entries/${editingId}`, {
          day: form.day,
          clientName: form.clientName,
          clientType: form.clientType,
          eventName: form.eventName,
          startTime: form.startTime,
          endTime: form.endTime,
          photoTeam: form.photoTeam,
          videoTeam: form.videoTeam,
          addons: form.addons,
          ...(form.createDeliverableTimeline ? { createDeliverableTimeline: true } : {}),
        });
        return data;
      }
      const { data } = await api.post("/production-calendar/entries", {
        ...form,
      });
      return data;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditingId(null);
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["team-shoot-schedule"] });
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
      await qc.invalidateQueries({ queryKey: ["team-shoot-schedule"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
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
    if (!selectedKey) return;
    setEditingId("new");
    setForm(emptyForm(selectedKey));
    setDialogOpen(true);
  }

  function openEdit(entry: ShootCalendarEntry) {
    setEditingId(entry.id);
    setForm({
      day: calendarDayKeyFromIso(entry.day),
      clientName: entry.clientName,
      clientType: entry.clientType,
      eventName: entry.eventName,
      startTime: entry.startTime,
      endTime: entry.endTime,
      photoTeam: entry.photoTeam,
      videoTeam: entry.videoTeam,
      addons: entry.addons,
      createDeliverableTimeline: !entry.eventId,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Production calendar</h1>
        <p className="text-sm text-muted-foreground">
          Log shoot-day details (client, times, on-site photo/video crew, add-ons). Optionally create the standard deliverable timeline so you can assign editors under{" "}
          <Link className="underline" to="/team/assign-deliverables">
            Assign deliverables
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,380px)]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
            <div>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{isLoading ? "Loading…" : "Click a day to view or add shoots."}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => shiftMonth(-1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => shiftMonth(1)}>
                Next
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:text-xs">
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (cell.day === null) {
                  return <div key={`p-${i}`} className="min-h-[88px] rounded-md bg-muted/30 sm:min-h-[96px]" />;
                }
                const key = localDayKey(cursor.y, cursor.m, cell.day);
                const list = entriesByDay.get(key) ?? [];
                const dueN = duesInMonth.get(key)?.length ?? 0;
                const isToday = key === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
                const isSel = selectedKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={cn(
                      "flex min-h-[88px] flex-col rounded-md border p-1.5 text-left text-[11px] transition-colors hover:bg-accent/50 sm:min-h-[96px] sm:text-xs",
                      isToday && "border-primary ring-1 ring-primary/30",
                      isSel && "bg-accent ring-2 ring-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 font-semibold">
                      <span>{cell.day}</span>
                      <span className="flex gap-0.5">
                        {list.length > 0 ? <span className="h-2 w-2 rounded-full bg-primary" title="Shoot logged" /> : null}
                        {dueN > 0 ? <span className="h-2 w-2 rounded-full bg-amber-500" title="Deliverable due" /> : null}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {list.slice(0, 2).map((e) => (
                        <div key={e.id} className="truncate text-muted-foreground" title={e.clientName}>
                          {e.clientName}
                        </div>
                      ))}
                      {list.length > 2 ? <div className="text-muted-foreground">+{list.length - 2} more</div> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Shoot entry
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Deliverable due (linked job)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardHeader>
            <CardTitle>{selectedKey ?? "Pick a day"}</CardTitle>
            <CardDescription>Shoot logistics and linked post-production tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedKey ? (
              <p className="text-sm text-muted-foreground">Select a date on the calendar.</p>
            ) : (
              <>
                <Button type="button" className="w-full" onClick={openNew}>
                  Add shoot / event details
                </Button>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logged shoots</div>
                  <div className="space-y-3">
                    {selectedEntries.map((e) => (
                      <div key={e.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="font-medium">{e.clientName}</div>
                        {e.eventName ? <div className="text-muted-foreground">{e.eventName}</div> : null}
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {e.clientType ? <div>Type: {e.clientType}</div> : null}
                          {(e.startTime || e.endTime) && (
                            <div>
                              Time: {e.startTime || "—"} – {e.endTime || "—"}
                            </div>
                          )}
                          {e.photoTeam ? <div className="whitespace-pre-wrap">Photo on-site: {e.photoTeam}</div> : null}
                          {e.videoTeam ? <div className="whitespace-pre-wrap">Video on-site: {e.videoTeam}</div> : null}
                          {e.addons ? <div className="whitespace-pre-wrap">Add-ons: {e.addons}</div> : null}
                          <div className="text-[11px]">Updated by {e.createdBy.name}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {e.eventId ? (
                            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">Deliverables linked</span>
                          ) : (
                            <span className="rounded-md border border-dashed px-2 py-0.5 text-xs">No deliverable timeline</span>
                          )}
                          <Button variant="outline" size="sm" type="button" onClick={() => openEdit(e)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={deleteEntry.isPending}
                            onClick={() => deleteEntry.mutate(e.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing logged for this day yet.</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliverables due this day</div>
                  {selectedDues.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No linked deadlines on this date.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {selectedDues.map(({ task: t, clientName }) => (
                        <li key={t.id} className="rounded-md border px-3 py-2">
                          <span className="font-medium">{clientName}</span> — {t.taskType.replaceAll("_", " ")}
                          {t.assignedTo ? <span className="text-muted-foreground"> · {t.assignedTo.name}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId === "new" ? "Add shoot details" : "Edit shoot details"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Day</div>
              <Input type="date" value={form.day} onChange={(ev) => setForm((f) => ({ ...f, day: ev.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Client name</div>
              <Input value={form.clientName} onChange={(ev) => setForm((f) => ({ ...f, clientName: ev.target.value }))} placeholder="e.g. Rahul & Priya" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Type of client</div>
              <Input value={form.clientType} onChange={(ev) => setForm((f) => ({ ...f, clientType: ev.target.value }))} placeholder="Wedding, corporate…" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Event name</div>
              <Input value={form.eventName} onChange={(ev) => setForm((f) => ({ ...f, eventName: ev.target.value }))} placeholder="Reception, ceremony…" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Start time</div>
              <Input value={form.startTime} onChange={(ev) => setForm((f) => ({ ...f, startTime: ev.target.value }))} placeholder="10:00 AM" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">End time</div>
              <Input value={form.endTime} onChange={(ev) => setForm((f) => ({ ...f, endTime: ev.target.value }))} placeholder="6:00 PM" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Photo team (on-site)</div>
              <textarea
                className={cn(
                  "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={form.photoTeam}
                onChange={(ev) => setForm((f) => ({ ...f, photoTeam: ev.target.value }))}
                placeholder="Names / crew going"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Video team (on-site)</div>
              <textarea
                className={cn(
                  "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={form.videoTeam}
                onChange={(ev) => setForm((f) => ({ ...f, videoTeam: ev.target.value }))}
                placeholder="Names / crew going"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Add-ons</div>
              <textarea
                className={cn(
                  "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={form.addons}
                onChange={(ev) => setForm((f) => ({ ...f, addons: ev.target.value }))}
                placeholder="Anything extra to remember"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={timelineAlreadyLinked ? false : form.createDeliverableTimeline}
                disabled={timelineAlreadyLinked}
                onChange={(ev) => setForm((f) => ({ ...f, createDeliverableTimeline: ev.target.checked }))}
              />
              <span className="text-sm leading-snug">
                Create standard deliverable deadlines (preview +7d, full photos +20d, videos +30/+45d, album +45d) for this client on this date.
                {timelineAlreadyLinked ? (
                  <span className="block text-xs text-muted-foreground">This row already has a linked timeline.</span>
                ) : null}
              </span>
            </label>
          </div>
          {saveEntry.isError ? <p className="mt-2 text-sm text-destructive">{errMsg(saveEntry.error)}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saveEntry.isPending || !form.clientName.trim()} onClick={() => saveEntry.mutate()}>
              {saveEntry.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
