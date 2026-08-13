import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { getCareersFormUrl } from "@/lib/careersUrl";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminFields";
import { AdminSurface } from "@/components/admin/AdminSurface";
import {
  AdminButton,
  AdminFilterChip,
  AdminStatCard,
  useAdminPalette,
} from "@/components/admin/AdminUi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CareerApplication, CareerApplicationStatus, CareerStats } from "@/types/careers";
import {
  CAREER_STATUS_COLORS,
  CAREER_STATUS_LABELS,
  CareerApplicationStatus as StatusEnum,
} from "@/types/careers";

async function fetchStats() {
  const { data } = await api.get<CareerStats>("/admin/careers/stats");
  return data;
}

async function fetchApplications(params: { status?: string; search?: string }) {
  const { data } = await api.get<{ applications: CareerApplication[]; total: number }>("/admin/careers", {
    params,
  });
  return data;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "ALL", label: "All" },
  { key: StatusEnum.NEW, label: "New" },
  { key: StatusEnum.REVIEWING, label: "Reviewing" },
  { key: StatusEnum.SHORTLISTED, label: "Shortlisted" },
  { key: StatusEnum.REJECTED, label: "Rejected" },
  { key: StatusEnum.HIRED, label: "Hired" },
];

export function TeamCareersPanel() {
  const palette = useAdminPalette();
  const qc = useQueryClient();
  const formUrl = getCareersFormUrl();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CareerApplication | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const statsQ = useQuery({ queryKey: ["admin-careers-stats"], queryFn: fetchStats });
  const listQ = useQuery({
    queryKey: ["admin-careers", statusFilter, search],
    queryFn: () =>
      fetchApplications({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search.trim() || undefined,
      }),
  });

  const applications = listQ.data?.applications ?? [];
  const stats = statsQ.data;

  const updateMut = useMutation({
    mutationFn: async (payload: { id: string; status?: CareerApplicationStatus; notes?: string }) => {
      const { data } = await api.patch<{ application: CareerApplication }>(`/admin/careers/${payload.id}`, {
        status: payload.status,
        notes: payload.notes,
      });
      return data.application;
    },
    onSuccess: async (app) => {
      setSelected(app);
      setNotesDraft(app.notes);
      await qc.invalidateQueries({ queryKey: ["admin-careers"] });
      await qc.invalidateQueries({ queryKey: ["admin-careers-stats"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/careers/${id}`);
    },
    onSuccess: async () => {
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["admin-careers"] });
      await qc.invalidateQueries({ queryKey: ["admin-careers-stats"] });
    },
  });

  const openCount = useMemo(() => {
    if (!stats) return 0;
    return stats.new + stats.reviewing + stats.shortlisted;
  }, [stats]);

  async function copyFormLink() {
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: palette.text }}>
            Careers inbox
          </h2>
          <p className="mt-1 text-sm" style={{ color: palette.textSecondary }}>
            Applications from the JOIN US Google Form appear here automatically after the form is linked.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="outline" onClick={copyFormLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy form link"}
          </AdminButton>
          <a href={formUrl} target="_blank" rel="noreferrer" className="admin-btn">
            <ExternalLink className="h-4 w-4" />
            Open JOIN US form
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats?.total ?? "—"} />
        <AdminStatCard label="Open pipeline" value={openCount || "—"} />
        <AdminStatCard label="Shortlisted" value={stats?.shortlisted ?? "—"} />
        <AdminStatCard label="Hired" value={stats?.hired ?? "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <AdminFilterChip
            key={f.key}
            active={statusFilter === f.key}
            label={f.label}
            onClick={() => setStatusFilter(f.key)}
          />
        ))}
        <AdminInput
          className="ml-auto max-w-xs"
          placeholder="Search name, phone, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {listQ.isLoading ? (
        <p className="text-sm" style={{ color: palette.textSecondary }}>
          Loading applications…
        </p>
      ) : null}

      {!listQ.isLoading && applications.length === 0 ? (
        <AdminSurface className="py-14 text-center">
          <p className="font-medium" style={{ color: palette.text }}>
            No career applications yet
          </p>
          <p className="mt-2 text-sm" style={{ color: palette.textSecondary }}>
            Share the JOIN US form — new submissions land in this tab.
          </p>
        </AdminSurface>
      ) : null}

      {applications.length > 0 ? (
        <ul className="divide-y rounded-2xl border" style={{ borderColor: palette.border, backgroundColor: palette.card }}>
          {applications.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
                onClick={() => {
                  setSelected(app);
                  setNotesDraft(app.notes);
                }}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold" style={{ color: palette.text }}>
                    {app.name || "Unnamed"}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: palette.textSecondary }}>
                    {app.roleApplied || "Role TBD"} · {app.experience || "Experience n/a"} · {fmtDate(app.submittedAt)}
                  </div>
                  <div className="mt-1 truncate text-xs" style={{ color: palette.textSecondary }}>
                    {app.phoneNumber}
                    {app.email ? ` · ${app.email}` : ""}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    CAREER_STATUS_COLORS[app.status],
                  )}
                >
                  {CAREER_STATUS_LABELS[app.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" style={{ backgroundColor: palette.card, borderColor: palette.border }}>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: palette.text }}>{selected.name || "Applicant"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm" style={{ color: palette.textSecondary }}>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Role:
                  </span>{" "}
                  {selected.roleApplied || "—"}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Experience:
                  </span>{" "}
                  {selected.experience || "—"}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Phone:
                  </span>{" "}
                  {selected.phoneNumber || "—"}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Email:
                  </span>{" "}
                  {selected.email || "—"}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Softwares:
                  </span>{" "}
                  {selected.softwares || "—"}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Portfolio:
                  </span>{" "}
                  {selected.portfolioUrl ? (
                    <a className="underline" href={selected.portfolioUrl} target="_blank" rel="noreferrer">
                      {selected.portfolioUrl}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
                <p>
                  <span className="font-medium" style={{ color: palette.text }}>
                    Instagram:
                  </span>{" "}
                  {selected.instagramLink ? (
                    <a
                      className="underline"
                      href={
                        selected.instagramLink.startsWith("http")
                          ? selected.instagramLink
                          : `https://instagram.com/${selected.instagramLink.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selected.instagramLink}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="text-xs">Submitted {fmtDate(selected.submittedAt)}</p>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold uppercase" style={{ color: palette.textSecondary }}>
                  Status
                </label>
                <AdminSelect
                  value={selected.status}
                  onChange={(e) =>
                    updateMut.mutate({ id: selected.id, status: e.target.value as CareerApplicationStatus })
                  }
                >
                  {Object.values(StatusEnum).map((s) => (
                    <option key={s} value={s}>
                      {CAREER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-xs font-semibold uppercase" style={{ color: palette.textSecondary }}>
                  Notes
                </label>
                <AdminTextarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
                <AdminButton
                  variant="outline"
                  disabled={updateMut.isPending || notesDraft === selected.notes}
                  onClick={() => updateMut.mutate({ id: selected.id, notes: notesDraft })}
                >
                  Save notes
                </AdminButton>
              </div>

              <div className="mt-4 border-t pt-4" style={{ borderColor: palette.border }}>
                <AdminButton
                  variant="outline"
                  className="text-rose-700"
                  disabled={deleteMut.isPending}
                  onClick={() => {
                    if (window.confirm("Delete this application?")) deleteMut.mutate(selected.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </AdminButton>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
