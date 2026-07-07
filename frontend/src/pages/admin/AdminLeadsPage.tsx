import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, ExternalLink, FileText, MessageSquare, Phone, RefreshCw, UserPlus } from "lucide-react";
import { getEnquiryUrl, enquiryShareMessage } from "@/lib/enquiryUrl";
import { getQuotationPublicUrl, quotationWhatsAppMessage } from "@/lib/quotationUrl";
import type { Quotation } from "@/types/quotation";
import { api } from "@/services/api";
import { AdminInput, AdminSelect } from "@/components/admin/AdminFields";
import { AdminSurface } from "@/components/admin/AdminSurface";
import {
  AdminButton,
  AdminFilterChip,
  AdminPageHeader,
  AdminStatCard,
  useAdminPalette,
} from "@/components/admin/AdminUi";
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

const STATUS_DOT: Record<LeadStatus, string> = {
  NEW: "#7D8FA8",
  CONTACTED: "#D59B3A",
  NEGOTIATION: "#8B6A45",
  CONFIRMED: "#4F7F5A",
  LOST: "#C45B52",
  ARCHIVED: "#6B7280",
};

const PIPELINE_STATUSES: LeadStatus[] = [
  LeadStatusEnum.NEW,
  LeadStatusEnum.CONTACTED,
  LeadStatusEnum.NEGOTIATION,
  LeadStatusEnum.CONFIRMED,
];

const OUTCOME_STATUSES: LeadStatus[] = [LeadStatusEnum.LOST, LeadStatusEnum.ARCHIVED];

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

async function fetchQuotations(leadId: string) {
  const { data } = await api.get<{ quotations: Quotation[] }>(`/admin/leads/${leadId}/quotations`);
  return data.quotations;
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
  const palette = useAdminPalette();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState<"link" | "message" | "quote-link" | "quote-message" | null>(null);
  const enquiryUrl = getEnquiryUrl();

  async function copyText(text: string, kind: "link" | "message" | "quote-link" | "quote-message") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

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
  const quotationsQ = useQuery({
    queryKey: ["admin-lead-quotations", selectedId],
    queryFn: () => fetchQuotations(selectedId!),
    enabled: !!selectedId,
  });

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

  const filterOptions = ["ALL", ...Object.values(LeadStatusEnum)] as const;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        label="LEADS"
        title="Lead pipeline"
        subtitle="Enquiries from website and manual entry — follow up through conversion."
        actions={
          <>
            <AdminButton variant="outline" onClick={() => void copyText(enquiryUrl, "link")}>
              {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy enquiry link
            </AdminButton>
            <AdminButton variant="outline" onClick={() => void copyText(enquiryShareMessage(enquiryUrl), "message")}>
              {copied === "message" ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              WhatsApp message
            </AdminButton>
            <AdminButton
              variant="ghost"
              onClick={() => {
                void statsQ.refetch();
                void leadsQ.refetch();
              }}
            >
              <RefreshCw className={cn("h-4 w-4", (statsQ.isRefetching || leadsQ.isRefetching) && "animate-spin")} />
              Refresh
            </AdminButton>
          </>
        }
      />

      <AdminSurface padding="p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.textSecondary }}>
          Public enquiry form
        </div>
        <a href={enquiryUrl} target="_blank" rel="noreferrer" className="truncate text-sm font-medium hover:underline" style={{ color: palette.accent }}>
          {enquiryUrl}
        </a>
      </AdminSurface>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((c) => (
          <AdminStatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      <AdminSurface>
        <div className="mb-4 flex flex-wrap gap-2">
          {filterOptions.map((s) => (
            <AdminFilterChip
              key={s}
              active={statusFilter === s}
              label={s === "ALL" ? "All" : LEAD_STATUS_LABELS[s as LeadStatus]}
              dotColor={s === "ALL" ? undefined : STATUS_DOT[s as LeadStatus]}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>

        <AdminInput
          placeholder="Search name, phone, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 max-w-md"
        />

        {leadsQ.isLoading ? (
          <p className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
            Loading leads…
          </p>
        ) : leads.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: palette.textSecondary }}>
            No leads yet. Copy the enquiry link above and send it to your next client.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: palette.border }}>
            {leads.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-4 px-2 py-4 text-left transition hover:opacity-90"
                  onClick={() => setSelectedId(l.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold" style={{ color: palette.text }}>
                        {displayName(l)}
                      </span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: palette.textSecondary }}>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.phoneNumber}
                      </span>
                      <span>{fmtDate(l.eventDate)}</span>
                      <span>{l.eventLocation}</span>
                      <span>{LEAD_SOURCE_LABELS[l.source]}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0" style={{ color: palette.textSecondary }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminSurface>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
          {lead ? (
            <div className="flex flex-col">
              <div className="border-b px-6 py-5 pr-14" style={{ borderColor: palette.border }}>
                <DialogHeader className="mb-0">
                  <DialogTitle className="text-xl font-bold tracking-tight" style={{ color: palette.text }}>
                    {displayName(lead)}
                  </DialogTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={lead.status} />
                    <span className="text-xs" style={{ color: palette.textSecondary }}>
                      {LEAD_SOURCE_LABELS[lead.source]} · {fmtDate(lead.eventDate)}
                    </span>
                  </div>
                </DialogHeader>
              </div>

              <div className="space-y-6 px-6 py-5">
                <LeadModalSection label="Contact & event">
                  <div className="grid gap-4 rounded-xl border-2 border-black p-4 sm:grid-cols-2" style={{ backgroundColor: palette.surface }}>
                    <Info label="Phone" value={lead.phoneNumber} />
                    {lead.email ? <Info label="Email" value={lead.email} /> : <Info label="Email" value="—" />}
                    <Info label="Event date" value={fmtDate(lead.eventDate)} />
                    <Info label="Location" value={lead.eventLocation} />
                    <Info label="Type" value={lead.eventType === "WEDDING" ? "Wedding" : "Other"} />
                    {lead.assignedTo ? <Info label="Assigned" value={lead.assignedTo.name} /> : <Info label="Assigned" value="Unassigned" />}
                  </div>
                </LeadModalSection>

                {lead.message ? (
                  <LeadModalSection label="Enquiry message">
                    <div className="rounded-xl border-2 border-black p-4 text-sm leading-relaxed" style={{ backgroundColor: palette.surface, color: palette.text }}>
                      {lead.message}
                    </div>
                  </LeadModalSection>
                ) : null}

                <LeadModalSection label="Pipeline stage">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {PIPELINE_STATUSES.map((status) => (
                        <LeadStatusStageButton
                          key={status}
                          status={status}
                          active={lead.status === status}
                          disabled={patchLead.isPending}
                          onSelect={() => {
                            if (lead.status !== status) patchLead.mutate({ id: lead.id, status });
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.textSecondary }}>
                        Outcome
                      </span>
                      {OUTCOME_STATUSES.map((status) => (
                        <LeadStatusStageButton
                          key={status}
                          status={status}
                          active={lead.status === status}
                          disabled={patchLead.isPending}
                          onSelect={() => {
                            if (lead.status !== status) patchLead.mutate({ id: lead.id, status });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </LeadModalSection>

                <LeadModalSection label="Assign to">
                  <AdminSelect
                    className="w-full"
                    value={lead.assignedToId ?? "NONE"}
                    onChange={(e) => patchLead.mutate({ id: lead.id, assignedToId: e.target.value === "NONE" ? null : e.target.value })}
                  >
                    <option value="NONE">Unassigned</option>
                    {(rosterQ.data ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </AdminSelect>
                </LeadModalSection>

                {lead.status === "CONFIRMED" && !lead.convertedEntryId ? (
                  <AdminButton className="w-full" disabled={convertLead.isPending} onClick={() => convertLead.mutate(lead.id)}>
                    <UserPlus className="h-4 w-4" />
                    {convertLead.isPending ? "Converting…" : "Convert to client"}
                  </AdminButton>
                ) : null}
                {lead.convertedEntryId ? (
                  <p className="rounded-xl border-2 border-black px-4 py-3 text-sm font-medium" style={{ borderColor: `${palette.success}66`, backgroundColor: `${palette.success}14`, color: palette.success }}>
                    Converted — calendar entry created.
                  </p>
                ) : null}

                {lead.status === "NEGOTIATION" ? (
                  <Link
                    to={`/admin/quotations/builder/${lead.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: `${palette.accent}14`, color: palette.text }}
                  >
                    <FileText className="h-4 w-4" style={{ color: palette.accent }} />
                    Create quotation
                  </Link>
                ) : null}

                {(quotationsQ.data?.length ?? 0) > 0 ? (
                  <LeadModalSection label="Quotations">
                    <ul className="space-y-3">
                      {quotationsQ.data!.map((q) => {
                        const url = getQuotationPublicUrl(q.slug);
                        return (
                          <li key={q.id} className="rounded-xl border-2 border-black p-4 text-sm" style={{ backgroundColor: palette.surface }}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-semibold" style={{ color: palette.text }}>
                                  Version {q.version}
                                </span>
                                <span className="ml-2" style={{ color: palette.textSecondary }}>
                                  {q.packageAmount}
                                </span>
                              </div>
                              <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ borderColor: palette.border, color: palette.textSecondary }}>
                                {q.status.replaceAll("_", " ")}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <AdminButton variant="outline" onClick={() => void copyText(url, "quote-link")}>
                                Copy link
                              </AdminButton>
                              <AdminButton
                                variant="outline"
                                onClick={() => void copyText(quotationWhatsAppMessage(displayName(lead), url), "quote-message")}
                              >
                                WhatsApp
                              </AdminButton>
                              <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-2xl border-2 border-black px-3 py-2 text-xs font-semibold" style={{ color: palette.text }}>
                                <ExternalLink className="h-3 w-3" />
                                Preview
                              </a>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </LeadModalSection>
                ) : null}

                <LeadModalSection label="Notes">
                  <div className="flex gap-2">
                    <AdminInput value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add follow-up note…" className="flex-1" />
                    <AdminButton variant="outline" disabled={!noteText.trim() || addNote.isPending} onClick={() => addNote.mutate()}>
                      <MessageSquare className="h-4 w-4" />
                    </AdminButton>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {lead.notes.map((n) => (
                      <li key={n.id} className="rounded-xl border-2 border-black p-3 text-sm" style={{ backgroundColor: palette.surface }}>
                        <div className="text-xs" style={{ color: palette.textSecondary }}>
                          {n.author.name} · {new Date(n.createdAt).toLocaleString()}
                        </div>
                        <p className="mt-1" style={{ color: palette.text }}>
                          {n.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                </LeadModalSection>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm" style={{ color: palette.textSecondary }}>
              Loading…
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", LEAD_STATUS_COLORS[status])}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

function LeadModalSection({ label, children }: { label: string; children: ReactNode }) {
  const palette = useAdminPalette();
  return (
    <section>
      <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.textSecondary }}>
        {label}
      </h3>
      {children}
    </section>
  );
}

function LeadStatusStageButton({
  status,
  active,
  disabled,
  onSelect,
}: {
  status: LeadStatus;
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn("admin-chip transition-opacity", active ? "admin-chip--active" : "", disabled && "opacity-60")}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : STATUS_DOT[status] }} />
      {LEAD_STATUS_LABELS[status]}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const palette = useAdminPalette();
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.textSecondary }}>
        {label}
      </div>
      <div className="mt-0.5" style={{ color: palette.text }}>
        {value}
      </div>
    </div>
  );
}
