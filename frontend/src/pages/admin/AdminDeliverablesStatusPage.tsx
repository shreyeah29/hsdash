import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { TaskStatus } from "@/types/domain";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

async function fetchAllTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

/** Read-only view for admins — monitoring progress; assignments are handled by the production coordinator. */
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

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold">Deliverables status</h1>
        <p className="text-sm text-muted-foreground">
          Monitor deadlines, assignees, and status across teams. Task assignment is done by the production coordinator (Emmanuel) from the team portal.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search client, task, or assignee…" value={q} onChange={(e) => setQ(e.target.value)} />
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
      {error ? <div className="text-sm text-destructive">Failed to load tasks</div> : null}

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.event?.clientName ?? "-"}</TableCell>
                <TableCell>{t.taskType.replaceAll("_", " ")}</TableCell>
                <TableCell>{t.assignedTeam.replaceAll("_", " ")}</TableCell>
                <TableCell>{t.assignedTo?.name ?? "—"}</TableCell>
                <TableCell>{new Date(t.deadline).toLocaleDateString()}</TableCell>
                <TableCell>
                  <PriorityBadge priority={t.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
