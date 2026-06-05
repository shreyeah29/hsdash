import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ADDONS,
  AWARDS,
  BRAND,
  DELIVERABLES,
  DELIVERABLES_FOOTNOTE,
  EVENTS_FOOTNOTE,
  HEIRLOOMS_QUOTE,
  INTRODUCTION,
  PACKAGE_NOTES,
  TESTIMONIALS,
  TERMS,
} from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function formatEventDay(iso: string) {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return { day, month };
}

function viewerKey() {
  const k = "hs_qv";
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

export function PublicQuotationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [revisionSent, setRevisionSent] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get<{ quotation: Quotation }>(`${apiBase}/quotations/${slug}`);
        if (cancelled) return;
        setQuotation(data.quotation);
        await axios.post(`${apiBase}/quotations/${slug}/view`, { viewerKey: viewerKey() });
      } catch (err) {
        if (!cancelled) setError("This proposal could not be loaded.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const expired = useMemo(() => {
    if (!quotation) return false;
    return quotation.status === "EXPIRED" || new Date(quotation.expiresAt) < new Date();
  }, [quotation]);

  const canAct = quotation && !expired && quotation.status === "ACTIVE";

  async function accept() {
    if (!slug) return;
    setActionBusy(true);
    try {
      await axios.post(`${apiBase}/quotations/${slug}/accept`);
      setAccepted(true);
      setShowAcceptConfirm(false);
    } catch {
      setError("Could not accept. Please contact us on WhatsApp.");
    } finally {
      setActionBusy(false);
    }
  }

  async function requestRevision() {
    if (!slug) return;
    setActionBusy(true);
    try {
      await axios.post(`${apiBase}/quotations/${slug}/revision`, { message: "" });
      setRevisionSent(true);
    } catch {
      setError("Could not send revision request.");
    } finally {
      setActionBusy(false);
    }
  }

  if (error && !quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-6 text-center text-[#2C2C2C]">
        <p>{error}</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B8965A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C] antialiased">
      {/* Cover */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${BRAND.heroImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/90 via-[#1a1a1a]/40 to-[#1a1a1a]/20" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 px-6 pb-20 pt-32 md:px-12 md:pb-28"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#E8DCC8]">{BRAND.name}</p>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-light leading-[1.1] text-white md:text-6xl lg:text-7xl">
            {quotation.clientName}
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.25em] text-[#D4C4A8]">Wedding Photography Proposal</p>
          <p className="mt-8 text-xs text-white/50">Version {quotation.version}</p>
        </motion.div>
      </section>

      {/* Introduction */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Introduction</p>
          <h2 className="mt-4 font-serif text-3xl font-light md:text-4xl">{BRAND.tagline}</h2>
          <div className="mt-8 space-y-5 text-[15px] leading-[1.85] text-[#4A4A4A]">
            {INTRODUCTION.split("\n\n").map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Heirlooms */}
      <section className="bg-[#F5EFE6] px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-light italic text-[#2C2C2C] md:text-3xl">Wedding Heirlooms</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#5C5C5C] md:text-base">{HEIRLOOMS_QUOTE}</p>
        </div>
      </section>

      {/* Deliverables */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Deliverables</p>
          <div className="mt-12 space-y-10">
            {DELIVERABLES.map((d) => (
              <div key={d.title} className="border-t border-[#E0D5C5] pt-8 first:border-t-0 first:pt-0">
                <h3 className="font-serif text-lg font-medium tracking-wide text-[#2C2C2C]">{d.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5C5C5C]">{d.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs italic text-[#888]">{DELIVERABLES_FOOTNOTE}</p>
        </div>
      </section>

      {/* Awards */}
      <section className="bg-[#2C2C2C] px-6 py-16 text-[#FAF7F2] md:px-12 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#B8965A]">Awards & Recognitions</p>
          <p className="mt-2 text-xs tracking-[0.3em] text-[#888]">{BRAND.established}</p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {AWARDS.map((a) => (
              <div key={a.title} className="border border-[#444] p-8">
                <p className="font-serif text-lg">{a.title}</p>
                <p className="mt-2 text-sm text-[#AAA]">{a.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events — PDF page 5 (dynamic) */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Upcoming Events</p>
          <p className="mt-2 text-sm text-[#888]">For: {quotation.clientName}</p>
          <p className="mt-6 text-[11px] uppercase tracking-wide text-[#999]">{EVENTS_FOOTNOTE}</p>
          <div className="mt-10 space-y-0">
            {quotation.events.map((ev, i) => {
              const { day, month } = formatEventDay(ev.eventDate);
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[72px_1fr] gap-4 border-b border-[#E8DFD0] py-8 md:grid-cols-[96px_1fr]"
                >
                  <div className="text-right">
                    <div className="font-serif text-3xl font-light text-[#B8965A] md:text-4xl">{day}</div>
                    <div className="text-xs font-semibold tracking-[0.2em] text-[#888]">{month}</div>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-medium uppercase tracking-wide md:text-2xl">{ev.eventName}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-wider text-[#666]">
                      {ev.teamSize ? <span>{ev.teamSize}</span> : null}
                      {ev.duration ? <span>{ev.duration}</span> : null}
                      {ev.venue ? <span>{ev.venue}</span> : null}
                    </div>
                    {ev.notes ? <p className="mt-2 text-sm text-[#777]">{ev.notes}</p> : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Package — PDF page 6 (dynamic) */}
      <section className="bg-[#F5EFE6] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.4em] text-[#B8965A]">Package</p>
          <div className="mt-10 rounded-sm border border-[#D4C4A8]/60 bg-[#FAF7F2] p-8 md:p-12">
            <p className="text-center font-serif text-3xl font-light text-[#2C2C2C] md:text-4xl">{quotation.packageAmount}</p>
            <div className="mt-10 space-y-6 border-t border-[#E0D5C5] pt-8">
              <PriceRow label="Booking Amount" value={quotation.bookingAmount} />
              {quotation.secondPayment ? <PriceRow label="Second Payment" value={quotation.secondPayment} /> : null}
              {quotation.finalPayment ? <PriceRow label="Final Payment" value={quotation.finalPayment} /> : null}
            </div>
            {quotation.additionalNotes ? (
              <p className="mt-8 text-sm italic text-[#666]">{quotation.additionalNotes}</p>
            ) : (
              <ul className="mt-8 space-y-2 text-sm text-[#666]">
                {PACKAGE_NOTES.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>

          {quotation.includeEngagementPackage ? (
            <div className="mt-8 rounded-sm border border-[#D4C4A8]/40 bg-white/50 p-8">
              <p className="text-center text-xs uppercase tracking-[0.2em] text-[#888]">Engagement Package</p>
              <p className="mt-4 text-center font-serif text-2xl font-light">{quotation.engagementPackageAmount}</p>
              <div className="mt-6 space-y-4">
                <PriceRow label="Booking Amount" value={quotation.engagementBookingAmount} small />
                <PriceRow label="Final Payment" value={quotation.engagementFinalPayment} small />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Add-ons — static PDF page 7 */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Add Ons</p>
          <div className="mt-12 space-y-8">
            {ADDONS.map((a) => (
              <div key={a.name} className="flex flex-col gap-2 border-b border-[#E8DFD0] pb-8 sm:flex-row sm:justify-between">
                <div className="max-w-md">
                  <h3 className="font-serif text-lg">{a.name}</h3>
                  <p className="mt-1 text-sm text-[#666]">{a.desc}</p>
                </div>
                <p className="shrink-0 font-medium text-[#B8965A]">{a.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#2C2C2C] px-6 py-20 text-[#FAF7F2] md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-[#B8965A]">They said yes!</p>
          <div className="mt-12 space-y-12">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="border-l-2 border-[#B8965A] pl-6">
                <p className="text-sm leading-relaxed text-[#CCC] md:text-base">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 text-sm font-medium text-[#B8965A]">{t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B8965A]">Terms & Conditions</p>
          <div className="mt-10 space-y-8">
            {TERMS.map((t) => (
              <div key={t.title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C2C2C]">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#666]">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client actions */}
      <section className="sticky bottom-0 border-t border-[#E0D5C5] bg-[#FAF7F2]/95 px-6 py-6 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
          {accepted ? (
            <p className="w-full py-3 text-center font-serif text-lg text-[#2C2C2C]">Thank you — we&apos;ll be in touch shortly.</p>
          ) : revisionSent ? (
            <p className="w-full py-3 text-center text-sm text-[#666]">Revision request sent. Our team will contact you.</p>
          ) : expired ? (
            <p className="w-full py-3 text-center text-sm text-[#888]">This proposal has expired. Please contact us for an updated quote.</p>
          ) : (
            <>
              <button
                type="button"
                disabled={!canAct || actionBusy}
                onClick={() => setShowAcceptConfirm(true)}
                className="flex-1 rounded-none border border-[#2C2C2C] bg-[#2C2C2C] py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF7F2] transition hover:bg-[#1a1a1a] disabled:opacity-40"
              >
                Accept Quotation
              </button>
              <button
                type="button"
                disabled={!canAct || actionBusy}
                onClick={requestRevision}
                className="flex-1 rounded-none border border-[#B8965A] bg-transparent py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#B8965A] transition hover:bg-[#B8965A]/10 disabled:opacity-40"
              >
                Request Revision
              </button>
            </>
          )}
        </div>
      </section>

      {showAcceptConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="max-w-md bg-[#FAF7F2] p-8 text-center">
            <h3 className="font-serif text-2xl font-light">Confirm acceptance</h3>
            <p className="mt-4 text-sm text-[#666]">
              By accepting, you agree to proceed with the package outlined in this proposal.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAcceptConfirm(false)}
                className="flex-1 border border-[#CCC] py-3 text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={accept}
                className="flex-1 bg-[#2C2C2C] py-3 text-xs uppercase tracking-wider text-white"
              >
                {actionBusy ? "…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PriceRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <p className={`uppercase tracking-wider text-[#888] ${small ? "text-[10px]" : "text-xs"}`}>{label}</p>
      <p className={`mt-1 text-[#2C2C2C] ${small ? "text-sm" : "text-base md:text-lg"}`}>{value}</p>
    </div>
  );
}
