import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCalendarNote, Event, Task } from "@/types/domain";
import { cn } from "@/lib/utils";
import axios from "axios";

type EventWithTasks = Event & { tasks: Task[] };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Calendar grid cell key for the visible month (user's local wall calendar).
 */
function localDayKey(y: number, monthIndex: number, day: number) {
  return `${y}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

/**
 * Bucket API timestamps that represent a calendar date (event date, deadlines, notes).
 * Uses UTC date parts so `2026-05-16T00:00:00.000Z` stays May 16 everywhere — avoids dots on the wrong day in US timezones.
 */
function calendarDayKeyFromIso(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function parseDayKey(key: string): { y: number; m: number } | null {
  const parts = key.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { y: parts[0], m: parts[1] - 1 };
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
  const { data: events = [], isLoading: evLoading, error: evError } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEventsCal,
  });
  const { data: notes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ["calendar-notes", from, to],
    queryFn: () => fetchNotes(from, to),
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    if (!selectedKey) return;
    const parsed = parseDayKey(selectedKey);
    if (!parsed || parsed.y !== cursor.y || parsed.m !== cursor.m) {
      setSelectedKey(null);
    }
  }, [cursor.y, cursor.m, selectedKey]);

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
      const k = calendarDayKeyFromIso(e.eventDate);
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const notesByDay = useMemo(() => {
    const m = new Map<string, AdminCalendarNote[]>();
    for (const n of notes) {
      const k = calendarDayKeyFromIso(n.day);
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
        const k = calendarDayKeyFromIso(t.deadline);
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

  const loadError = evError || notesError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Weddings, deliverable due dates, and notes appear on each day (same dates as your events API — timezone-safe).
        </p>
      </div>

      {loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Could not load calendar data. Check that you are logged in as admin and the API URL is correct.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_minmax(280px,340px)]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
            <div>
              <CardTitle>{label}</CardTitle>
              <CardDescription>
                {evLoading || notesLoading ? "Loading…" : "Scroll cells for busy days — click a day to add or manage notes."}
              </CardDescription>
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
                  return <div key={`e-${i}`} className="min-h-[140px] rounded-md bg-muted/30 sm:min-h-[160px]" />;
                }
                const key = localDayKey(cursor.y, cursor.m, cell.day);
                const dayEvents = eventsByDay.get(key) ?? [];
                const dayNotes = notesByDay.get(key) ?? [];
                const dayDue = tasksDueByDay.get(key) ?? [];
                const hasEvent = dayEvents.length > 0;
                const hasNote = dayNotes.length > 0;
                const hasDue = dayDue.length > 0;
                const isToday = key === localDayKey(now.getFullYear(), now.getMonth(), now.getDate());
                const isSel = selectedKey === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={cn(
                      "flex min-h-[140px] max-h-[220px] flex-col rounded-md border p-1.5 text-left text-xs transition-colors hover:bg-accent/50 sm:min-h-[160px] sm:max-h-[260px]",
                      isToday && "border-primary ring-1 ring-primary/30",
                      isSel && "bg-accent ring-2 ring-primary/40",
                    )}
                  >
                    <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border/60 pb-1">
                      <span className="text-sm font-semibold">{cell.day}</span>
                      <span className="flex shrink-0 gap-0.5">
                        {hasEvent ? (
                          <span className="h-2 w-2 rounded-full bg-primary" title="Event" aria-hidden />
                        ) : null}
                        {hasDue ? (
                          <span className="h-2 w-2 rounded-full bg-amber-500" title="Due" aria-hidden />
                        ) : null}
                        {hasNote ? (
                          <span className="h-2 w-2 rounded-full bg-violet-500" title="Note" aria-hidden />
                        ) : null}
                      </span>
                    </div>

                    <div className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 text-[11px] leading-snug sm:text-xs">
                      {dayEvents.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-primary">Events</div>
                          {dayEvents.map((e) => (
                            <div key={e.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-foreground" title={e.clientName}>
                              {e.clientName}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {dayDue.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-amber-700 dark:text-amber-400">Due</div>
                          {dayDue.map(({ task: t, clientName }) => (
                            <div
                              key={t.id}
                              className="truncate rounded bg-amber-500/15 px-1 py-0.5"
                              title={`${clientName} — ${t.taskType.replaceAll("_", " ")}`}
                            >
                              <span className="font-medium">{clientName}</span>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-muted-foreground">{t.taskType.replaceAll("_", " ")}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {dayNotes.length > 0 ? (
                        <div className="space-y-0.5">
                          <div className="font-semibold text-violet-700 dark:text-violet-400">Notes</div>
                          {dayNotes.map((n) => (
                            <div
                              key={n.id}
                              className="line-clamp-3 whitespace-pre-wrap break-words rounded bg-violet-500/10 px-1 py-0.5 text-muted-foreground"
                              title={[n.title, n.body].filter(Boolean).join("\n")}
                            >
                              {n.title ? <span className="font-medium text-foreground">{n.title}: </span> : null}
                              {n.body || "(empty)"}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {!hasEvent && !hasDue && !hasNote ? (
                        <div className="pt-1 text-[10px] text-muted-foreground sm:text-[11px]">—</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Event date
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Deliverable due
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Note
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-4 xl:self-start">
          <CardHeader>
            <CardTitle>{selectedKey ? selectedKey : "Pick a day"}</CardTitle>
            <CardDescription>Add notes or delete them here. Events and due work are shown on the grid.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!selectedKey ? (
              <p className="text-sm text-muted-foreground">Select a date on the calendar.</p>
            ) : (
              <>
                <div className="rounded-md border bg-muted/30 p-3 text-sm xl:hidden">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">This day (summary)</div>
                  <ul className="space-y-2">
                    {selectedEvents.map((e) => (
                      <li key={e.id}>
                        <span className="font-medium text-primary">{e.clientName}</span>
                        <span className="text-muted-foreground"> — event</span>
                      </li>
                    ))}
                    {selectedTasksDue.map(({ task: t, clientName }) => (
                      <li key={t.id}>
                        <span className="font-medium text-amber-700 dark:text-amber-400">{clientName}</span>
                        <span className="text-muted-foreground"> · {t.taskType.replaceAll("_", " ")} due</span>
                      </li>
                    ))}
                    {selectedEvents.length === 0 && selectedTasksDue.length === 0 ? (
                      <li className="text-muted-foreground">No events or deadlines.</li>
                    ) : null}
                  </ul>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your notes</div>
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
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deleteNote.mutate(n.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {selectedNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No notes yet — add one below.</p>
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
                    {createNote.isError ? (
                      <p className="text-sm text-destructive">{errMsg(createNote.error)}</p>
                    ) : null}
                    <Button
                      type="button"
                      disabled={createNote.isPending || (!noteTitle.trim() && !noteBody.trim())}
                      onClick={() => createNote.mutate()}
                    >
                      {createNote.isPending ? "Saving…" : "Save note"}
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
