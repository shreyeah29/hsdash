import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Phone, RefreshCw, UserPlus } from "lucide-react";
import { api } from "@/services/api";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { GradientShimmerText } from "@/components/premium/GradientShimmerText";
import { Spotlight } from "@/components/premium/Spotlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LeadDetail, LeadStats, LeadStatus, LeadSummary } from "@/types/leads";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  LeadStatus as LeadStatusEnum,
} from "@/types/leads";
import type { User } from "@/types/domain";

async function fetchStats() {
  const { data } = await api.get<LeadStats>("/admin/leads/stats");
  return data;
}

async function fetchLeads(params: { status?: string; search?: string }) {
  const { data } = await api.get<{ leads: LeadSummary[]; total: number }>("/admin/leads", { params });
  return data;
}

async function fetchLead(id: string) {
  const { data } = await api.get<{ lead: LeadDetail }>(`/admin/leads/${id}`);
  return data.lead;
}

async function fetchRoster() {
  const { data } = await api.get<{ users: User[] }>("/production-calendar/team-members");
  return data.users;
}

function displayName(lead: LeadSummary) {
  if (lead.eventType === "WEDDING") {
    const b = lead.brideName.trim();
    const g = lead.groomName.trim();
    if (b && g) return `${b} & ${g}`;
    if (b || g) return b || g;
  }
  return lead.clientName.trim() || lead.name.trim() || "Lead";
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export function AdminLeadsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const statsQ = useQuery({ queryKey: ["admin-leads-stats"], queryFn: fetchStats });
  const leadsQ = useQuery({
    queryKey: ["admin-leads", statusFilter, search],
    queryFn: () =>
      fetchLeads({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
  });
  const detailQ = useQuery({
    queryKey: ["admin-lead", selectedId],
    queryFn: () => fetchLead(selectedId!),
    enabled: !!selectedId,
  });
  const rosterQ = useQuery({ queryKey: ["production-calendar-roster"], queryFn: fetchRoster });

  const patchLead = useMutation({
    mutationFn: async (payload: { id: string; status?: LeadStatus; assignedToId?: string | null }) => {
      const { id, ...body } = payload;
      const { data } = await api.patch(`/admin/leads/${id}`, body);
      return data.lead as LeadDetail;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-leads"] });
      await qc.invalidateQueries({ queryKey: ["admin-leads-stats"] });
      await qc.invalidateQueries({ queryKey: ["admin-lead", selectedId] });
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      await api.post(`/admin/leads/${selectedId}/notes`, { content: noteText });
    },
    onSuccess: async () => {
      setNoteText("");
      await qc.invalidateQueries({ queryKey: ["admin-lead", selectedId] });
    },
  });

  const convertLead = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/leads/${id}/convert`);
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-leads"] });
      await qc.invalidateQueries({ queryKey: ["admin-leads-stats"] });
      await qc.invalidateQueries({ queryKey: ["admin-lead", selectedId] });
      await qc.invalidateQueries({ queryKey: ["production-calendar-entries"] });
      await qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const stats = statsQ.data;
  const leads = leadsQ.data?.leads ?? [];
  const lead = detailQ.data;

  const statCards = useMemo(
    () =>
      stats
        ? [
            { label: "Total", value: stats.total },
            { label: "New", value: stats.new },
            { label: "Contacted", value: stats.contacted },
            { label: "Negotiation", value: stats.negotiation },
            { label: "Confirmed", value: stats.confirmed },
            { label: "Lost", value: stats.lost },
            { label: "Conversion", value: `${stats.conversionRate}%` },
          ]
        : [],
    [stats],
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Spotlight className="rounded-3xl border border-zinc-200/80" glowColor="rgba(167, 139, 250, 0.08)">
        <div className="flex flex-col gap-4 px-1 py-1 md:flex-row md:items-end md:justify-between md:px-2 md:py-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">CRM</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              <GradientShimmerText>Leads</GradientShimmerText>
            </h1>
            <p className="mt-2 text-sm text-zinc-600">Enquiries from website and manual entry — follow up through conversion.</p>
          </div>
          <Button type="button" variant="glass" size="sm" className="gap-2 rounded-xl" onClick={() => { void statsQ.refetch(); void leadsQ.refetch(); }}>
            <RefreshCw className={cn("h-4 w-4", (statsQ.isRefetching || leadsQ.isRefetching) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </Spotlight>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((c) => (
          <GlassPanel key={c.label} className="p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-900">{c.value}</div>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search name, phone, location…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(LeadStatusEnum).map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </Select>
        </div>

        {leadsQ.isLoading ? (
          <p className="py-12 text-center text-sm text-zinc-600">Loading leads…</p>
        ) : leads.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-600">No leads yet. Share the public enquiry link: /enquiry</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 px-2 py-4 text-left hover:bg-violet-50/50"
                  onClick={() => setSelectedId(l.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-900">{displayName(l)}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.phoneNumber}
                      </span>
                      <span>{fmtDate(l.eventDate)}</span>
                      <span>{l.eventLocation}</span>
                      <span>{LEAD_SOURCE_LABELS[l.source]}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {lead ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {displayName(lead)}
                  <StatusBadge status={lead.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Info label="Phone" value={lead.phoneNumber} />
                {lead.email ? <Info label="Email" value={lead.email} /> : null}
                <Info label="Event date" value={fmtDate(lead.eventDate)} />
                <Info label="Location" value={lead.eventLocation} />
                <Info label="Source" value={LEAD_SOURCE_LABELS[lead.source]} />
                <Info label="Type" value={lead.eventType === "WEDDING" ? "Wedding" : "Other"} />
                {lead.assignedTo ? <Info label="Assigned" value={lead.assignedTo.name} /> : null}
              </div>

              {lead.message ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">{lead.message}</div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Select
                  value={lead.status}
                  onValueChange={(v) => patchLead.mutate({ id: lead.id, status: v as LeadStatus })}
                >
                  {Object.values(LeadStatusEnum).map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  value={lead.assignedToId ?? "NONE"}
                  onValueChange={(v) =>
                    patchLead.mutate({ id: lead.id, assignedToId: v === "NONE" ? null : v })
                  }
                >
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {(rosterQ.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {lead.status === "CONFIRMED" && !lead.convertedEntryId ? (
                <Button
                  type="button"
                  variant="premium"
                  className="w-full rounded-xl"
                  disabled={convertLead.isPending}
                  onClick={() => convertLead.mutate(lead.id)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {convertLead.isPending ? "Converting…" : "Convert to client"}
                </Button>
              ) : null}
              {lead.convertedEntryId ? (
                <p className="text-sm text-emerald-700">Converted — calendar entry created.</p>
              ) : null}

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</h3>
                <div className="flex gap-2">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add follow-up note…"
                  />
                  <Button type="button" variant="glass" disabled={!noteText.trim() || addNote.isPending} onClick={() => addNote.mutate()}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                <ul className="mt-3 space-y-2">
                  {lead.notes.map((n) => (
                    <li key={n.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                      <div className="text-xs text-zinc-500">
                        {n.author.name} · {new Date(n.createdAt).toLocaleString()}
                      </div>
                      <p className="mt-1 text-zinc-800">{n.content}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Timeline</h3>
                <ul className="space-y-2">
                  {lead.activities.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <span className="shrink-0 text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString()}</span>
                      <span className="text-zinc-800">
                        {a.kind.replaceAll("_", " ")}
                        {a.message ? ` — ${a.message}` : ""}
                        {a.actor ? ` (${a.actor.name})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-600">Loading…</p>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", LEAD_STATUS_COLORS[status])}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-0.5 text-zinc-900">{value}</div>
    </div>
  );
}
