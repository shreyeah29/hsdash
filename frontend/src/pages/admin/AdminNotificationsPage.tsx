import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function activityLoadErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) {
      return "The API returned 404 for /admin/task-activity. Your Render backend is probably still on an older deploy — open your Render Web Service, confirm it builds from the latest main branch, then Manual Deploy → Clear build cache & deploy. Calendar notes use the same /admin routes.";
    }
    if (status === 401 || status === 403) {
      return "You are not authorized. Sign out and sign back in as admin.";
    }
    if (!error.response) {
      return "Network error — check VITE_API_URL and that the Render service is up.";
    }
    return `Request failed (${status ?? "?"}).`;
  }
  return "Could not load activity.";
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
  const { data = [], isLoading, error, refetch, isRefetching, isFetching } = useQuery({
    queryKey: ["admin-task-activity"],
    queryFn: fetchActivity,
  });

  const showEmpty = !isLoading && !error && data.length === 0;

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
          <div className="flex flex-wrap items-center gap-2">
            {isFetching ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {!isLoading ? (
              <Button type="button" variant="outline" size="sm" disabled={isRefetching} onClick={() => refetch()}>
                Refresh
              </Button>
            ) : null}
          </div>
          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {activityLoadErrorMessage(error)}
            </div>
          ) : null}
          {showEmpty ? (
            <p className="text-sm text-muted-foreground">
              No updates yet. Status changes appear here when team members update tasks.
            </p>
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
