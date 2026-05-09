import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Event, Task } from "@/types/domain";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type EventWithTasks = Event & { tasks: Task[] };

async function fetchEvents() {
  const { data } = await api.get<{ events: EventWithTasks[] }>("/events");
  return data.events;
}

export function EventsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState<string>("");
  const [selected, setSelected] = useState<EventWithTasks | null>(null);

  const createEvent = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/events", { clientName, eventDate });
      return data;
    },
    onSuccess: async () => {
      setClientName("");
      setEventDate("");
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
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Client name (e.g. Rahul & Priya)" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            <Button
              disabled={!clientName || !eventDate || createEvent.isPending}
              onClick={() => createEvent.mutate()}
            >
              Create Event
            </Button>
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
                  <li key={t.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{t.taskType.replaceAll("_", " ")}</span>
                    <span className="text-muted-foreground">{new Date(t.deadline).toLocaleDateString()}</span>
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

