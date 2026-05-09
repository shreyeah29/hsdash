import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCalendarNote, Event, Task } from "@/types/domain";
import { cn } from "@/lib/utils";

type EventWithTasks = Event & { tasks: Task[] };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Local calendar day key YYYY-MM-DD for the given calendar cell. */
function localDayKey(y: number, monthIndex: number, day: number) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function localDayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return localDayKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function monthRangeIso(y: number, monthIndex: number) {
  const last = new Date(y, monthIndex + 1, 0);
  return { from: localDayKey(y, monthIndex, 1), to: localDayKey(y, monthIndex, last.getDate()) };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function fetchEventsCal() {
  const { data } = await api.get<{ events: EventWithTasks[] }>("/events");
  return data.events;
}

async function fetchNotes(from: string, to: string) {
  const { data } = await api.get<{ notes: AdminCalendarNote[] }>("/admin/calendar-notes", { params: { from, to } });
  return data.notes;
}

export function AdminCalendarPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const { from, to } = monthRangeIso(cursor.y, cursor.m);
  const { data: events = [], isLoading: evLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEventsCal,
  });
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["calendar-notes", from, to],
    queryFn: () => fetchNotes(from, to),
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const grid = useMemo(() => {
    const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: { day: number | null }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }, [cursor.y, cursor.m]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, EventWithTasks[]>();
    for (const e of events) {
      const k = localDayKeyFromIso(e.eventDate);
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const notesByDay = useMemo(() => {
    const m = new Map<string, AdminCalendarNote[]>();
    for (const n of notes) {
      const k = localDayKeyFromIso(n.day);
      const arr = m.get(k) ?? [];
      arr.push(n);
      m.set(k, arr);
    }
    return m;
  }, [notes]);

  const tasksDueByDay = useMemo(() => {
    const m = new Map<string, { task: Task; clientName: string }[]>();
    for (const e of events) {
      for (const t of e.tasks ?? []) {
        const k = localDayKeyFromIso(t.deadline);
        const arr = m.get(k) ?? [];
        arr.push({ task: t, clientName: e.clientName });
        m.set(k, arr);
      }
    }
    return m;
  }, [events]);

  const selectedEvents = selectedKey ? eventsByDay.get(selectedKey) ?? [] : [];
  const selectedNotes = selectedKey ? notesByDay.get(selectedKey) ?? [] : [];
  const selectedTasksDue = selectedKey ? tasksDueByDay.get(selectedKey) ?? [] : [];

  const createNote = useMutation({
    mutationFn: async () => {
      if (!selectedKey) return;
      const { data } = await api.post("/admin/calendar-notes", {
        day: selectedKey,
        title: noteTitle.trim() || undefined,
        body: noteBody.trim(),
      });
      return data;
    },
    onSuccess: async () => {
      setNoteTitle("");
      setNoteBody("");
      await qc.invalidateQueries({ queryKey: ["calendar-notes", from, to] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/calendar-notes/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["calendar-notes", from, to] });
    },
  });

  const label = new Date(cursor.y, cursor.m, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  function shiftMonth(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Wedding dates, deliverable deadlines, and your notes per day.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
            <div>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{evLoading || notesLoading ? "Loading…" : "Click a day for details"}</CardDescription>
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
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAYS.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (cell.day === null) {
                  return <div key={`e-${i}`} className="min-h-[72px] rounded-md bg-muted/30" />;
                }
                const key = localDayKey(cursor.y, cursor.m, cell.day);
                const hasEvent = (eventsByDay.get(key)?.length ?? 0) > 0;
                const hasNote = (notesByDay.get(key)?.length ?? 0) > 0;
                const hasDue = (tasksDueByDay.get(key)?.length ?? 0) > 0;
                const isToday =
                  key === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
                const isSel = selectedKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={cn(
                      "flex min-h-[72px] flex-col rounded-md border p-1 text-left text-sm transition-colors hover:bg-accent/60",
                      isToday && "border-primary ring-1 ring-primary/30",
                      isSel && "bg-accent",
                    )}
                  >
                    <span className="font-medium">{cell.day}</span>
                    <span className="mt-auto flex flex-wrap gap-0.5">
                      {hasEvent ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Wedding / event" />
                      ) : null}
                      {hasDue ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Deliverable due" />
                      ) : null}
                      {hasNote ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" title="Admin note" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Event date
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Due deliverable
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Note
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle>{selectedKey ? selectedKey : "Pick a day"}</CardTitle>
            <CardDescription>Notes and workload for the selected date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selectedKey ? (
              <p className="text-sm text-muted-foreground">Select a date on the calendar.</p>
            ) : (
              <>
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Events
                  </div>
                  {selectedEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No weddings on this day.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {selectedEvents.map((e) => (
                        <li key={e.id} className="rounded-md border bg-muted/40 px-3 py-2">
                          <div className="font-medium">{e.clientName}</div>
                          <div className="text-xs text-muted-foreground">{e.tasks?.length ?? 0} deliverables</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Deliverables due
                  </div>
                  {selectedTasksDue.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing due this day.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {selectedTasksDue.map(({ task: t, clientName }) => (
                        <li key={t.id} className="rounded-md border px-3 py-2">
                          <div className="font-medium">{clientName}</div>
                          <div className="text-muted-foreground">
                            {t.taskType.replaceAll("_", " ")}
                            {t.assignedTo ? (
                              <span className="text-xs"> — {t.assignedTo.name}</span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your notes
                  </div>
                  <div className="space-y-2">
                    {selectedNotes.map((n) => (
                      <div key={n.id} className="rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {n.title ? <div className="font-medium">{n.title}</div> : null}
                            {n.body ? <div className="whitespace-pre-wrap text-muted-foreground">{n.body}</div> : null}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={deleteNote.isPending}
                            onClick={() => deleteNote.mutate(n.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2 border-t pt-4">
                    <Input placeholder="Note title (optional)" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                    <textarea
                      className={cn(
                        "flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      )}
                      placeholder="What needs to happen today?"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                    />
                    <Button
                      type="button"
                      disabled={createNote.isPending || (!noteTitle.trim() && !noteBody.trim())}
                      onClick={() => createNote.mutate()}
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
