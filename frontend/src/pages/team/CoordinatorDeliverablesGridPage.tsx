import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Task, User } from "@/types/domain";
import { WeddingDeliverablesSheetTable } from "@/components/deliverables/WeddingDeliverablesSheetTable";
import { AdminInput } from "@/components/admin/AdminFields";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { AdminSurface } from "@/components/admin/AdminSurface";
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
    <div className="space-y-8">
      <AdminPageHeader
        label="ASSIGNMENTS"
        title="Deliverables sheet"
        subtitle="One row per wedding — assign editors in each column. Status updates when crew mark work on their login."
        actions={
          <Link to="/coordinator/shoot-calendar" className="admin-btn">
            Shoot calendar →
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <AdminInput
          placeholder="Search wedding or editor…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <AdminStatCard label="Weddings" value={weddingCount} />
      </div>

      <AdminSurface padding="p-0 overflow-hidden">
        <WeddingDeliverablesSheetTable
          mode="coordinator"
          tasks={tasks}
          roster={roster}
          searchQuery={q}
          isLoading={isLoading}
          dataUpdatedAt={dataUpdatedAt}
        />
      </AdminSurface>
    </div>
  );
}
