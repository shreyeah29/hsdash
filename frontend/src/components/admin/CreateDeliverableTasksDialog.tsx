import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/services/api";
import type { User } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type EditorFields = {
  photoEditorId: string;
  cinematicEditorId: string;
  traditionalEditorId: string;
  albumEditorId: string;
};

const emptyEditors: EditorFields = {
  photoEditorId: "",
  cinematicEditorId: "",
  traditionalEditorId: "",
  albumEditorId: "",
};

const EDITOR_LANES = [
  ["Photo editor", "PHOTO_TEAM", "photoEditorId"] as const,
  ["Cinematic editor", "CINEMATIC_TEAM", "cinematicEditorId"] as const,
  ["Traditional editor", "TRADITIONAL_TEAM", "traditionalEditorId"] as const,
  ["Album editor", "ALBUM_TEAM", "albumEditorId"] as const,
];

function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string })?.message;
    if (typeof msg === "string") return msg;
    return e.message;
  }
  return "Something went wrong.";
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

export type CreateDeliverableTasksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, creates a calendar row on this day and links deliverable tasks. */
  calendarDay?: string | null;
  triggerLabel?: string;
};

/** Admin: spawn standard deliverable tasks (+ optional calendar shoot row). */
export function CreateDeliverableTasksDialog({
  open,
  onOpenChange,
  calendarDay,
}: CreateDeliverableTasksDialogProps) {
  const qc = useQueryClient();
  const today = useMemo(() => {
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
  }, []);

  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState(calendarDay ?? today);
  const [editors, setEditors] = useState<EditorFields>(emptyEditors);

  useEffect(() => {
    if (open) {
      setEventDate(calendarDay ?? today);
    }
  }, [open, calendarDay, today]);

  const { data: roster = [] } = useQuery({
    queryKey: ["production-calendar-roster"],
    queryFn: fetchRoster,
    enabled: open,
  });

  const rosterForTeam = useMemo(() => {
    const sorted = [...roster].sort((a, b) => a.name.localeCompare(b.name));
    return (teamKey: string) => sorted.filter((u) => u.team === teamKey || u.team === null);
  }, [roster]);

  const hasEditorPicks = !!(
    editors.photoEditorId ||
    editors.cinematicEditorId ||
    editors.traditionalEditorId ||
    editors.albumEditorId
  );

  const createTasks = useMutation({
    mutationFn: async () => {
      const day = calendarDay ?? eventDate;
      const payload = {
        clientName: clientName.trim(),
        createDeliverableTimeline: true,
        syncEditorAssignments: true,
        photoEditorId: editors.photoEditorId,
        cinematicEditorId: editors.cinematicEditorId,
        traditionalEditorId: editors.traditionalEditorId,
        albumEditorId: editors.albumEditorId,
      };

      if (calendarDay) {
        const { data } = await api.post("/production-calendar/entries", {
          day,
          clientType: "",
          eventName: "",
          venue: "",
          startTime: "",
          endTime: "",
          photoTeam: "",
          videoTeam: "",
          addons: "",
          ...payload,
        });
        return data;
      }

      const { data } = await api.post("/events", {
        clientName: payload.clientName,
        eventDate: day,
        ...(editors.photoEditorId ? { photoEditorId: editors.photoEditorId } : {}),
        ...(editors.cinematicEditorId ? { cinematicEditorId: editors.cinematicEditorId } : {}),
        ...(editors.traditionalEditorId ? { traditionalEditorId: editors.traditionalEditorId } : {}),
        ...(editors.albumEditorId ? { albumEditorId: editors.albumEditorId } : {}),
      });
      return data;
    },
    onError: (err) => {
      // eslint-disable-next-line no-alert
      window.alert(errMsg(err));
    },
    onSuccess: async (data) => {
      const summary = (data as { assignedEditors?: { name: string; email: string; taskCount: number }[] })
        ?.assignedEditors;
      const eventTasks = (data as { event?: { tasks?: unknown[] } })?.event?.tasks?.length;
      const taskCount =
        summary?.reduce((n, e) => n + e.taskCount, 0) ??
        (typeof eventTasks === "number" ? eventTasks : hasEditorPicks ? 5 : 5);

      const lines =
        summary && summary.length > 0
          ? summary.map((e) => `• ${e.name} (${e.email}) — ${e.taskCount} task(s)`).join("\n")
          : null;

      // eslint-disable-next-line no-alert
      window.alert(
        lines
          ? `Created ${taskCount} deliverable task(s).\n\n${lines}\n\nCrew dashboards refresh within a few seconds.`
          : `Created standard deliverable tasks (preview, photos, videos, album).\n\nAssign editors from the calendar or Assign crew if needed.`,
      );

      setClientName("");
      setEditors(emptyEditors);
      onOpenChange(false);

      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["events"] });
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      await qc.invalidateQueries({ queryKey: ["my-tasks"] });
      await qc.invalidateQueries({ queryKey: ["my-notifications"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
      await qc.invalidateQueries({ queryKey: ["tasks", "admin-monitor"] });
    },
  });

  const canSubmit = clientName.trim().length > 0 && (calendarDay ? true : !!eventDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create deliverable tasks</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-600">
          Spawns the standard deadline set (preview +7d, full photos +20d, videos +30/+45d, album +45d) and notifies
          assigned editors immediately.
          {calendarDay ? (
            <span className="mt-1 block font-medium text-violet-800">Also logs this shoot on {calendarDay}.</span>
          ) : null}
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-zinc-600">Client / wedding name</div>
            <Input
              placeholder="e.g. Rahul & Priya"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          {!calendarDay ? (
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-600">Event date (deadlines anchor here)</div>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          ) : (
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
              Shoot day: <span className="font-semibold">{calendarDay}</span>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Assign editors (optional)</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {EDITOR_LANES.map(([label, teamKey, field]) => {
                const options = rosterForTeam(teamKey);
                return (
                  <div key={teamKey} className="space-y-2 sm:col-span-2">
                    <div className="text-xs font-medium text-zinc-700">{label}</div>
                    <div className="space-y-1 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      {options.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-zinc-600">No editors listed yet.</div>
                      ) : (
                        options.map((u) => (
                          <label
                            key={u.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-800 hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300 bg-white text-violet-600"
                              checked={editors[field] === u.id}
                              onChange={() =>
                                setEditors((f) => ({
                                  ...f,
                                  [field]: f[field] === u.id ? "" : u.id,
                                }))
                              }
                            />
                            <span className="truncate">{u.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {createTasks.isError ? <p className="text-sm text-rose-600">{errMsg(createTasks.error)}</p> : null}

        <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <Button type="button" variant="glass" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="premium"
            className={cn("rounded-xl")}
            disabled={!canSubmit || createTasks.isPending}
            onClick={() => createTasks.mutate()}
          >
            {createTasks.isPending ? "Creating…" : "Create tasks"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
