import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, TaskAssigneeSummary, TaskStatus } from "@/types/domain";
import { StatusBadge } from "@/components/StatusBadge";

type ActivityRow = {
  id: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  createdAt: string;
  actor: TaskAssigneeSummary | null;
  task: {
    id: string;
    taskType: string;
    assignedTeam: string;
    event: Pick<Event, "clientName" | "eventDate"> | null;
  };
};

async function fetchActivity() {
  const { data } = await api.get<{ activities: ActivityRow[] }>("/admin/task-activity", { params: { limit: 100 } });
  return data.activities;
}

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminNotificationsPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-task-activity"],
    queryFn: fetchActivity,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team updates</h1>
        <p className="text-sm text-muted-foreground">
          Recent task status changes from team members (in progress, completed, and overdue transitions).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {error ? <p className="text-sm text-destructive">Could not load activity.</p> : null}
          {!isLoading && data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet. Status changes appear here when team members update tasks.</p>
          ) : null}
          <ul className="space-y-3">
            {data.map((a) => (
              <li key={a.id} className="rounded-lg border bg-card p-4 text-sm leading-relaxed">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{fmtWhen(a.createdAt)}</span>
                </div>
                <div className="mt-1 font-medium">
                  {a.actor?.name ?? "Someone"}
                  {a.actor?.team ? (
                    <span className="font-normal text-muted-foreground"> ({a.actor.team.replaceAll("_", " ")})</span>
                  ) : null}
                </div>
                <div className="mt-1">
                  <span className="text-muted-foreground">Job:</span>{" "}
                  <span>{a.task.event?.clientName ?? "Unknown client"}</span>
                  <span className="text-muted-foreground"> — </span>
                  <span>{a.task.taskType.replaceAll("_", " ")}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {a.previousStatus ? (
                    <>
                      <StatusBadge status={a.previousStatus} />
                      <span className="text-muted-foreground">→</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Set to</span>
                  )}
                  <StatusBadge status={a.newStatus} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
