import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Event, Task, User } from "@/types/domain";
import { Role, Team } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectItem } from "@/components/ui/select";

type EventWithTasks = Event & { tasks: Task[] };

const DELIVERABLE_ROWS = [
  { taskKey: "PREVIEW_PHOTOS" as const, label: "Preview photos", offsetDays: 7, team: Team.PHOTO_TEAM },
  { taskKey: "FULL_PHOTOS" as const, label: "Full edited photos", offsetDays: 20, team: Team.PHOTO_TEAM },
  { taskKey: "CINEMATIC_VIDEO" as const, label: "Cinematic video", offsetDays: 30, team: Team.CINEMATIC_TEAM },
  { taskKey: "TRADITIONAL_VIDEO" as const, label: "Traditional video", offsetDays: 45, team: Team.TRADITIONAL_TEAM },
  { taskKey: "ALBUM_DESIGN" as const, label: "Album design", offsetDays: 45, team: Team.ALBUM_TEAM },
];

type AssignDraft = Record<(typeof DELIVERABLE_ROWS)[number]["taskKey"], string>;

const emptyAssign: AssignDraft = {
  PREVIEW_PHOTOS: "",
  FULL_PHOTOS: "",
  CINEMATIC_VIDEO: "",
  TRADITIONAL_VIDEO: "",
  ALBUM_DESIGN: "",
};

async function fetchEvents() {
  const { data } = await api.get<{ events: EventWithTasks[] }>("/events");
  return data.events;
}

async function fetchUsersForAssign() {
  const { data } = await api.get<{ users: User[] }>("/users");
  return data.users;
}

export function EventsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: fetchUsersForAssign });

  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState<string>("");
  const [assign, setAssign] = useState<AssignDraft>(emptyAssign);
  const [selected, setSelected] = useState<EventWithTasks | null>(null);

  const createEvent = useMutation({
    mutationFn: async () => {
      const assignments = Object.fromEntries(
        (Object.entries(assign) as [keyof AssignDraft, string][]).filter(([, id]) => id.length > 0),
      );
      const { data } = await api.post("/events", {
        clientName,
        eventDate,
        ...(Object.keys(assignments).length ? { assignments } : {}),
      });
      return data;
    },
    onSuccess: async () => {
      setClientName("");
      setEventDate("");
      setAssign(emptyAssign);
      await qc.invalidateQueries({ queryKey: ["events"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["events"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Wedding Events</h1>
        <p className="text-sm text-muted-foreground">Creating an event automatically generates all deliverable tasks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Event</CardTitle>
          <CardDescription>Example: Rahul &amp; Priya — May 10, 2026</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Client</div>
              <Input placeholder="e.g. Rahul & Priya" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Event date</div>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <Button
              disabled={!clientName || !eventDate || createEvent.isPending}
              onClick={() => createEvent.mutate()}
            >
              Create Event
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <div className="mb-3 text-sm font-medium">Assign team members (optional)</div>
            <p className="mb-4 text-xs text-muted-foreground">
              Deadlines follow your fixed timeline (event date + days). Pick who owns each deliverable — leave blank to leave the task unassigned on that team&apos;s board.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {DELIVERABLE_ROWS.map((row) => {
                const members = users.filter(
                  (u) => u.role === Role.TEAM_MEMBER && u.isActive && u.team === row.team,
                );
                const val = assign[row.taskKey];
                return (
                  <div key={row.taskKey} className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {row.label}{" "}
                      <span className="text-muted-foreground/80">
                        (+{row.offsetDays} d · {row.team.replaceAll("_", " ")})
                      </span>
                    </div>
                    <Select
                      value={val || "__none__"}
                      onValueChange={(v) =>
                        setAssign((prev) => ({ ...prev, [row.taskKey]: v === "__none__" ? "" : v }))
                      }
                    >
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {members.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>{rows.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.clientName}</TableCell>
                  <TableCell>{new Date(e.eventDate).toLocaleDateString()}</TableCell>
                  <TableCell>{e.tasks?.length ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelected(e)}>
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteEvent.isPending}
                        onClick={() => deleteEvent.mutate(e.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No events yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.clientName ?? "Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Event date: </span>
              <span>{selected?.eventDate ? new Date(selected.eventDate).toLocaleDateString() : "-"}</span>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground mb-2">Auto-created tasks</div>
              <ul className="space-y-1">
                {(selected?.tasks ?? []).map((t) => (
                  <li key={t.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="truncate">{t.taskType.replaceAll("_", " ")}</span>
                    <span className="text-muted-foreground shrink-0">
                      Due {new Date(t.deadline).toLocaleDateString()}
                      {t.assignedTo ? ` · ${t.assignedTo.name}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

