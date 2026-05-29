import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Table2 } from "lucide-react";
import { api } from "@/services/api";
import type { Task, User } from "@/types/domain";
import { WeddingDeliverablesSheetTable } from "@/components/deliverables/WeddingDeliverablesSheetTable";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { Input } from "@/components/ui/input";
import { crewLiveQueryOptions } from "@/hooks/useCrewLiveData";

async function fetchTasks() {
  const { data } = await api.get<{ tasks: Task[] }>("/tasks");
  return data.tasks;
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

export function CoordinatorDeliverablesGridPage() {
  const [q, setQ] = useState("");

  const { data: tasks = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    ...crewLiveQueryOptions,
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["production-calendar-roster"],
    queryFn: fetchRoster,
    staleTime: 60_000,
  });

  const weddingCount = new Set(tasks.map((t) => t.eventId || t.event?.id).filter(Boolean)).size;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Assignments</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">Deliverables sheet</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            One row per wedding — assign editors in each column. Status updates when crew mark work on their login.
          </p>
          <Link to="/coordinator/shoot-calendar" className="skiper-link-accent mt-3 inline-flex text-sm font-medium text-amber-700">
            Shoot calendar →
          </Link>
        </div>

        <GlassPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" shine>
          <Input placeholder="Search wedding or editor…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-[240px]" />
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <Table2 className="h-4 w-4 text-amber-700" />
            <span>
              <span className="font-semibold text-zinc-900">{weddingCount}</span> weddings
            </span>
          </div>
        </GlassPanel>
      </div>

      <WeddingDeliverablesSheetTable
        mode="coordinator"
        tasks={tasks}
        roster={roster}
        searchQuery={q}
        isLoading={isLoading}
        dataUpdatedAt={dataUpdatedAt}
      />
    </motion.div>
  );
}
