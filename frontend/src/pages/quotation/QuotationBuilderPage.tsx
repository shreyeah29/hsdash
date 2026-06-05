import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Copy, MessageSquare, Plus, Trash2 } from "lucide-react";
import { api } from "@/services/api";
import { DEFAULT_PACKAGE } from "@/lib/quotationTemplate";
import { getQuotationPublicUrl, quotationWhatsAppMessage } from "@/lib/quotationUrl";
import type { LeadDetail } from "@/types/leads";
import type { Quotation } from "@/types/quotation";

type EventDraft = {
  eventName: string;
  venue: string;
  eventDate: string;
  teamSize: string;
  duration: string;
  notes: string;
};

const STEPS = ["Client", "Events", "Package", "Expiry", "Generate"] as const;

function displayName(lead: LeadDetail) {
  if (lead.eventType === "WEDDING") {
    const b = lead.brideName.trim();
    const g = lead.groomName.trim();
    if (b && g) return `${b} & ${g}`;
    if (b || g) return b || g;
  }
  return lead.clientName.trim() || lead.name.trim() || "Client";
}

function expiryFromPreset(preset: "24h" | "48h" | "7d" | "custom", customDate: string) {
  const now = new Date();
  if (preset === "24h") return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (preset === "48h") return new Date(now.getTime() + 48 * 60 * 60 * 1000);
  if (preset === "7d") return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return new Date(`${customDate}T23:59:59`);
}

function defaultEventDate(lead: LeadDetail) {
  try {
    return lead.eventDate.split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export function QuotationBuilderPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const [created, setCreated] = useState<Quotation | null>(null);

  const leadQ = useQuery({
    queryKey: ["admin-lead", leadId],
    queryFn: async () => {
      const { data } = await api.get<{ lead: LeadDetail }>(`/admin/leads/${leadId}`);
      return data.lead;
    },
    enabled: !!leadId,
  });

  const lead = leadQ.data;

  const [events, setEvents] = useState<EventDraft[]>([]);
  const [packageAmount, setPackageAmount] = useState(DEFAULT_PACKAGE.packageAmount);
  const [bookingAmount, setBookingAmount] = useState(DEFAULT_PACKAGE.bookingAmount);
  const [secondPayment, setSecondPayment] = useState(DEFAULT_PACKAGE.secondPayment);
  const [finalPayment, setFinalPayment] = useState(DEFAULT_PACKAGE.finalPayment);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [includeEngagement, setIncludeEngagement] = useState(false);
  const [engagementPackageAmount, setEngagementPackageAmount] = useState(DEFAULT_PACKAGE.engagementPackageAmount);
  const [engagementBookingAmount, setEngagementBookingAmount] = useState(DEFAULT_PACKAGE.engagementBookingAmount);
  const [engagementFinalPayment, setEngagementFinalPayment] = useState(DEFAULT_PACKAGE.engagementFinalPayment);
  const [expiryPreset, setExpiryPreset] = useState<"24h" | "48h" | "7d" | "custom">("48h");
  const [customExpiry, setCustomExpiry] = useState("");

  useEffect(() => {
    if (lead && events.length === 0) {
      const d = defaultEventDate(lead);
      setEvents([
        {
          eventName: "WEDDING",
          venue: lead.eventLocation || "",
          eventDate: d,
          teamSize: "TEAM OF 5",
          duration: "6 HOUR MAX",
          notes: "",
        },
      ]);
    }
  }, [lead, events.length]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = expiryFromPreset(expiryPreset, customExpiry);
      const { data } = await api.post<{ quotation: Quotation }>(`/admin/leads/${leadId}/quotations`, {
        packageAmount,
        bookingAmount,
        secondPayment,
        finalPayment,
        additionalNotes,
        includeEngagementPackage: includeEngagement,
        engagementPackageAmount: includeEngagement ? engagementPackageAmount : "",
        engagementBookingAmount: includeEngagement ? engagementBookingAmount : "",
        engagementFinalPayment: includeEngagement ? engagementFinalPayment : "",
        expiresAt: expiresAt.toISOString(),
        events,
      });
      return data.quotation;
    },
    onSuccess: (q) => setCreated(q),
  });

  async function copyText(text: string, kind: "link" | "message") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const canNext =
    step === 0 ||
    (step === 1 && events.length > 0 && events.every((e) => e.eventName && e.eventDate)) ||
    (step === 2 && packageAmount && bookingAmount) ||
    (step === 3 && (expiryPreset !== "custom" || customExpiry));

  if (!leadId) return null;

  if (leadQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B8965A] border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <p>Lead not found.</p>
      </div>
    );
  }

  const clientName = displayName(lead);
  const publicUrl = created ? getQuotationPublicUrl(created.slug) : "";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      <header className="sticky top-0 z-20 border-b border-[#E8DFD0] bg-[#FAF7F2]/95 px-6 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/admin/leads")}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#888] transition hover:text-[#2C2C2C]"
          >
            <ArrowLeft className="h-4 w-4" />
            Leads
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Create Quotation</p>
          <div className="w-16" />
        </div>
        <div className="mx-auto mt-6 flex max-w-3xl justify-between gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`h-1 w-full rounded-full transition ${i <= step ? "bg-[#B8965A]" : "bg-[#E8DFD0]"}`}
              />
              <span className={`text-[9px] uppercase tracking-wider ${i === step ? "text-[#2C2C2C]" : "text-[#AAA]"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {step === 0 ? (
              <section>
                <h1 className="font-serif text-3xl font-light md:text-4xl">{clientName}</h1>
                <p className="mt-2 text-sm text-[#888]">Lead ID · {lead.id.slice(0, 8)}…</p>
                <div className="mt-10 space-y-6 border-t border-[#E8DFD0] pt-10">
                  <Field label="Client name" value={clientName} readOnly />
                  <Field label="Phone" value={lead.phoneNumber} readOnly />
                  <Field label="Email" value={lead.email || "—"} readOnly />
                </div>
              </section>
            ) : null}

            {step === 1 ? (
              <section>
                <h2 className="font-serif text-2xl font-light">Upcoming Events</h2>
                <p className="mt-2 text-sm text-[#888]">Timeline cards — only these change per quotation.</p>
                <div className="mt-8 space-y-4">
                  {events.map((ev, i) => (
                    <div key={i} className="border border-[#E8DFD0] bg-white/40 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B8965A]">Event {i + 1}</span>
                        {events.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setEvents(events.filter((_, j) => j !== i))}
                            className="text-[#999] hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Editable label="Event name" value={ev.eventName} onChange={(v) => updateEvent(i, "eventName", v)} />
                        <Editable label="Venue" value={ev.venue} onChange={(v) => updateEvent(i, "venue", v)} />
                        <Editable label="Date" type="date" value={ev.eventDate} onChange={(v) => updateEvent(i, "eventDate", v)} />
                        <Editable label="Team size" value={ev.teamSize} onChange={(v) => updateEvent(i, "teamSize", v)} />
                        <Editable label="Duration" value={ev.duration} onChange={(v) => updateEvent(i, "duration", v)} />
                        <Editable label="Notes" value={ev.notes} onChange={(v) => updateEvent(i, "notes", v)} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEvents([
                      ...events,
                      {
                        eventName: "",
                        venue: lead.eventLocation || "",
                        eventDate: defaultEventDate(lead),
                        teamSize: "7 MEMBERS",
                        duration: "FULL DAY",
                        notes: "",
                      },
                    ])
                  }
                  className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#B8965A]"
                >
                  <Plus className="h-4 w-4" />
                  Add event
                </button>
              </section>
            ) : null}

            {step === 2 ? (
              <section>
                <h2 className="font-serif text-2xl font-light">Package</h2>
                <p className="mt-2 text-sm text-[#888]">Pricing — the heart of this proposal.</p>
                <div className="mt-8 space-y-6">
                  <Editable label="Package amount" value={packageAmount} onChange={setPackageAmount} />
                  <Editable label="Booking amount" value={bookingAmount} onChange={setBookingAmount} />
                  <Editable label="Second payment" value={secondPayment} onChange={setSecondPayment} />
                  <Editable label="Final payment" value={finalPayment} onChange={setFinalPayment} />
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.25em] text-[#888]">Additional notes</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows={3}
                      className="mt-2 w-full border-b border-[#D4C4A8] bg-transparent py-2 text-sm outline-none focus:border-[#B8965A]"
                      placeholder="Optional — leave blank for standard package notes"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={includeEngagement}
                      onChange={(e) => setIncludeEngagement(e.target.checked)}
                      className="accent-[#B8965A]"
                    />
                    Include engagement package
                  </label>
                  {includeEngagement ? (
                    <div className="space-y-4 border-l-2 border-[#B8965A]/40 pl-6">
                      <Editable label="Engagement package" value={engagementPackageAmount} onChange={setEngagementPackageAmount} />
                      <Editable label="Engagement booking" value={engagementBookingAmount} onChange={setEngagementBookingAmount} />
                      <Editable label="Engagement final payment" value={engagementFinalPayment} onChange={setEngagementFinalPayment} />
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section>
                <h2 className="font-serif text-2xl font-light">Expiry</h2>
                <p className="mt-2 text-sm text-[#888]">How long should this proposal stay active?</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {(["24h", "48h", "7d", "custom"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setExpiryPreset(p)}
                      className={`border py-4 text-xs uppercase tracking-[0.2em] transition ${
                        expiryPreset === p
                          ? "border-[#2C2C2C] bg-[#2C2C2C] text-[#FAF7F2]"
                          : "border-[#E8DFD0] bg-transparent text-[#666] hover:border-[#B8965A]"
                      }`}
                    >
                      {p === "24h" ? "24 Hours" : p === "48h" ? "48 Hours" : p === "7d" ? "7 Days" : "Custom Date"}
                    </button>
                  ))}
                </div>
                {expiryPreset === "custom" ? (
                  <input
                    type="date"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    className="mt-6 w-full border-b border-[#D4C4A8] bg-transparent py-3 text-sm outline-none"
                  />
                ) : null}
              </section>
            ) : null}

            {step === 4 ? (
              <section>
                {created ? (
                  <div className="text-center">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#B8965A]">
                      <Check className="h-6 w-6 text-[#B8965A]" />
                    </div>
                    <h2 className="font-serif text-3xl font-light">Proposal ready</h2>
                    <p className="mt-2 text-sm text-[#888]">Version {created.version} · {created.slug}</p>
                    <p className="mt-6 break-all text-sm text-[#B8965A]">{publicUrl}</p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => void copyText(publicUrl, "link")}
                        className="flex items-center justify-center gap-2 border border-[#2C2C2C] px-6 py-3 text-xs uppercase tracking-[0.2em]"
                      >
                        {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyText(quotationWhatsAppMessage(clientName, publicUrl), "message")}
                        className="flex items-center justify-center gap-2 bg-[#2C2C2C] px-6 py-3 text-xs uppercase tracking-[0.2em] text-white"
                      >
                        {copied === "message" ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        Copy WhatsApp message
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(publicUrl, "_blank")}
                      className="mt-6 text-xs uppercase tracking-[0.2em] text-[#888] underline"
                    >
                      Preview proposal
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="font-serif text-3xl font-light">Generate</h2>
                    <p className="mt-4 text-sm text-[#888]">
                      Creates a new version for <span className="text-[#2C2C2C]">{clientName}</span> with a secure link.
                    </p>
                    <button
                      type="button"
                      disabled={createMutation.isPending}
                      onClick={() => createMutation.mutate()}
                      className="mt-10 border border-[#2C2C2C] bg-[#2C2C2C] px-12 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#FAF7F2] transition hover:bg-[#1a1a1a] disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Creating…" : "Generate Quotation"}
                    </button>
                    {createMutation.isError ? (
                      <p className="mt-4 text-sm text-red-600">Could not create quotation. Try again.</p>
                    ) : null}
                  </div>
                )}
              </section>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {step < 4 || !created ? (
        <footer className="sticky bottom-0 border-t border-[#E8DFD0] bg-[#FAF7F2]/95 px-6 py-5 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-xs uppercase tracking-[0.2em] text-[#888] disabled:opacity-30"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => setStep((s) => s + 1)}
                className="bg-[#2C2C2C] px-8 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-30"
              >
                Continue
              </button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );

  function updateEvent(i: number, key: keyof EventDraft, value: string) {
    setEvents(events.map((e, j) => (j === i ? { ...e, [key]: value } : e)));
  }
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#888]">{label}</p>
      <p className="mt-2 font-serif text-xl text-[#2C2C2C]">{value}</p>
      {readOnly ? null : null}
    </div>
  );
}

function Editable({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.25em] text-[#888]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b border-[#D4C4A8] bg-transparent py-2 text-sm outline-none focus:border-[#B8965A]"
      />
    </div>
  );
}
