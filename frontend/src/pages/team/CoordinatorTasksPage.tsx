import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Task, Team, User } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

export function CoordinatorTasksPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });
  const { data: roster = [] } = useQuery({
    queryKey: ["coordinator-roster"],
    queryFn: fetchRoster,
  });

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesQ =
        !q ||
        t.taskType.toLowerCase().includes(q.toLowerCase()) ||
        t.event?.clientName?.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = status === "ALL" ? true : t.status === status;
      return matchesQ && matchesStatus;
    });
  }, [tasks, q, status]);

  const assign = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: string; assignedToId: string | null }) => {
      const { data } = await api.put(`/tasks/${id}/assignee`, { assignedToId });
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: TaskStatus }) => {
      const { data } = await api.put(`/tasks/${id}/status`, { status: next });
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["admin-task-activity"] });
    },
  });

  function assigneesForTeam(team: Team) {
    return roster.filter((u) => u.team === team);
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold">Assign deliverables</h1>
        <p className="text-sm text-muted-foreground">
          Everyone&apos;s tasks appear here. Assign each row to a specific editor on the owning team; they will see it on My Tasks with deadlines.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search client or task…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={TaskStatus.DELAYED}>Delayed</SelectItem>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} tasks</div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.event?.clientName ?? "-"}</TableCell>
                <TableCell>{t.taskType.replaceAll("_", " ")}</TableCell>
                <TableCell>{t.assignedTeam.replaceAll("_", " ")}</TableCell>
                <TableCell className="min-w-[160px]">
                  <Select
                    value={(t.assignedToId ?? t.assignedTo?.id) ?? "__none__"}
                    onValueChange={(v) =>
                      assign.mutate({ id: t.id, assignedToId: v === "__none__" ? null : v })
                    }
                  >
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {assigneesForTeam(t.assignedTeam).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>{new Date(t.deadline).toLocaleDateString()}</TableCell>
                <TableCell>
                  <PriorityBadge priority={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.IN_PROGRESS })}
                    >
                      In progress
                    </Button>
                    <Button
                      size="sm"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: t.id, next: TaskStatus.COMPLETED })}
                    >
                      Done
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No tasks yet — create deliverables from the production calendar.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
