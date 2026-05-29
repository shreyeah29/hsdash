import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { api } from "@/services/api";
import type { Task } from "@/types/domain";
import { WeddingDeliverablesSheetTable } from "@/components/deliverables/WeddingDeliverablesSheetTable";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Input } from "@/components/ui/input";
import { crewLiveQueryOptions } from "@/hooks/useCrewLiveData";

async function fetchAllTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

export function AdminDeliverablesStatusPage() {
  const [q, setQ] = useState("");

  const { data: tasks = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["tasks", "admin-monitor"],
    queryFn: fetchAllTasks,
    ...crewLiveQueryOptions,
  });

  const weddingCount = useMemo(
    () => new Set(tasks.map((t) => t.eventId || t.event?.id).filter(Boolean)).size,
    [tasks],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Deliverables</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Team status sheet</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Live view of every wedding — who owns each deliverable and current status. Updates when editors save on their dashboards.
          </p>
        </div>

        <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" shine>
          <Input placeholder="Search wedding or editor…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[240px]" />
          <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
            <Radar className="h-4 w-4 text-violet-600" />
            <span>
              <span className="font-semibold text-zinc-900">{weddingCount}</span> weddings
            </span>
          </div>
        </GlassPanel>
      </div>

      <WeddingDeliverablesSheetTable
        mode="admin"
        tasks={tasks}
        roster={[]}
        searchQuery={q}
        isLoading={isLoading}
        dataUpdatedAt={dataUpdatedAt}
      />
    </motion.div>
  );
}
