import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Activity, Radio, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { BorderBeam } from "@/components/premium/BorderBeam";
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
      return "The API returned 404 for /admin/task-activity. Your backend deploy may be stale — redeploy from latest main with migrations applied.";
    }
    if (status === 401 || status === 403) {
      return "You are not authorized. Sign out and sign back in as admin.";
    }
    if (!error.response) {
      return "Network error — check VITE_API_URL and that the API is reachable.";
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

const feedContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.055 } },
};

const feedItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
};

export function AdminNotificationsPage() {
  const { data = [], isLoading, error, refetch, isRefetching, isFetching } = useQuery({
    queryKey: ["admin-task-activity"],
    queryFn: fetchActivity,
  });

  const showEmpty = !isLoading && !error && data.length === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-10">
      <Spotlight className="rounded-3xl border border-white/[0.06]" glowColor="rgba(34, 211, 238, 0.12)">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3 px-1 py-1 md:px-2 md:py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Signal stream</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              <GradientShimmerText>Team pulse</GradientShimmerText>
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Live transcription of task motion across editors — every completion and lane change with cinematic clarity.
            </p>
          </div>

          <GlassPanel className="flex flex-wrap items-center gap-3 p-4 shine">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 text-xs text-zinc-400">
              <Radio className="h-4 w-4 text-cyan-300/90" />
              <span>
                <span className="font-semibold text-white">{data.length}</span> events buffered
              </span>
            </div>
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="rounded-xl gap-2"
              disabled={isRefetching}
              onClick={() => refetch()}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </GlassPanel>
        </div>
      </Spotlight>

      <GlassPanel className="relative overflow-hidden p-6 md:p-8 shine">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
            <Activity className="h-5 w-5 text-violet-200" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Activity timeline</h2>
            <p className="text-xs text-zinc-500">Newest signals first · synced with backend audit trail</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] pb-5">
          {isFetching && !isLoading ? <span className="text-xs text-zinc-500">Refreshing feed…</span> : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-rose-400/25 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
            {activityLoadErrorMessage(error)}
          </div>
        ) : null}

        {isLoading ? <p className="mt-8 text-center text-sm text-zinc-500">Pulling latest transitions…</p> : null}

        {showEmpty ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">Quiet channel</p>
            <p className="mt-2 text-sm text-zinc-500">
              No updates yet. Once editors move tasks between lanes, the timeline glows automatically.
            </p>
          </div>
        ) : null}

        {!isLoading && data.length > 0 ? (
          <div className="relative mt-8">
            <div className="pointer-events-none absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-violet-500/40 via-cyan-400/15 to-transparent" />
            <motion.ul variants={feedContainer} initial="hidden" animate="show" className="relative space-y-4">
              {data.map((a) => (
                <motion.li key={a.id} variants={feedItem} className="relative pl-12">
                  <span className="absolute left-[15px] top-6 z-[1] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-violet-300/40 bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.55)]" />

                  <BorderBeam>
                    <GlassPanel className="border-white/[0.06] p-5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        <span className="tabular-nums text-zinc-400">{fmtWhen(a.createdAt)}</span>
                        <span className="rounded-md border border-white/10 bg-black/35 px-2 py-0.5 text-[10px] normal-case tracking-normal text-zinc-400">
                          {a.task.assignedTeam.replaceAll("_", " ")}
                        </span>
                      </div>

                      <p className="mt-3 text-[15px] font-semibold text-white">
                        {a.actor?.name ?? "Someone"}
                        {a.actor?.team ? (
                          <span className="font-normal text-zinc-500"> · {a.actor.team.replaceAll("_", " ")}</span>
                        ) : null}
                      </p>

                      <p className="mt-2 text-sm text-zinc-400">
                        <span className="text-zinc-500">Deliverable · </span>
                        {a.task.event?.clientName ?? "Unknown client"}
                        <span className="text-zinc-600"> — </span>
                        <span className="text-zinc-200">{a.task.taskType.replaceAll("_", " ")}</span>
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {a.previousStatus ? (
                          <>
                            <StatusBadge status={a.previousStatus} />
                            <span className="text-xs text-zinc-600">→</span>
                          </>
                        ) : (
                          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Initialized</span>
                        )}
                        <StatusBadge status={a.newStatus} />
                      </div>
                    </GlassPanel>
                  </BorderBeam>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        ) : null}
      </GlassPanel>
    </motion.div>
  );
}
