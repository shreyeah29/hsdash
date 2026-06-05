import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { QUOTATION_PAGES } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";
import { EventsBrochurePage } from "./EventsBrochurePage";
import { PackageBrochurePage } from "./PackageBrochurePage";
import "./quotation-brochure.css";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function viewerKey() {
  const k = "hs_qv";
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}

function StaticPage({ src, alt }: { src: string; alt: string }) {
  return (
    <section className="quotation-brochure-page">
      <img src={src} alt={alt} className="quotation-brochure-img" loading="lazy" decoding="async" />
    </section>
  );
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
        document.title = `${data.quotation.clientName} · Harishankar Photography`;
        await axios.post(`${apiBase}/quotations/${slug}/view`, { viewerKey: viewerKey() });
      } catch {
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
      <div className="quotation-brochure flex min-h-screen items-center justify-center px-6 text-center text-[#e8dfd4]">
        <p>{error}</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="quotation-brochure flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B8965A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="quotation-brochure min-h-screen pb-2">
      <StaticPage src={QUOTATION_PAGES.cover} alt="Harishankar Photography" />
      <StaticPage src={QUOTATION_PAGES.introduction} alt="Introduction" />
      <StaticPage src={QUOTATION_PAGES.heirlooms} alt="Wedding Heirlooms" />
      <StaticPage src={QUOTATION_PAGES.deliverables} alt="Deliverables" />
      <StaticPage src={QUOTATION_PAGES.awards} alt="Awards and recognitions" />

      <EventsBrochurePage quotation={quotation} />
      <PackageBrochurePage quotation={quotation} />

      <StaticPage src={QUOTATION_PAGES.addons} alt="Add ons" />
      <StaticPage src={QUOTATION_PAGES.testimonials} alt="Testimonials" />
      <StaticPage src={QUOTATION_PAGES.terms} alt="Terms and conditions" />

      <footer className="qb-actions">
        <div className="qb-actions-inner">
          {accepted ? (
            <p className="w-full py-3 text-center font-serif text-base text-[#2C2C2C]">
              Thank you — we&apos;ll be in touch shortly.
            </p>
          ) : revisionSent ? (
            <p className="w-full py-3 text-center text-sm text-[#666]">
              Revision request sent. Our team will contact you.
            </p>
          ) : expired ? (
            <p className="w-full py-3 text-center text-sm text-[#888]">
              This proposal has expired. Please contact us for an updated quote.
            </p>
          ) : (
            <>
              <button type="button" disabled={!canAct || actionBusy} onClick={() => setShowAcceptConfirm(true)} className="qb-btn-accept">
                Accept Quotation
              </button>
              <button type="button" disabled={!canAct || actionBusy} onClick={requestRevision} className="qb-btn-revision">
                Request Revision
              </button>
            </>
          )}
        </div>
      </footer>

      {showAcceptConfirm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">
          <div className="max-w-md bg-[#FAF7F2] p-8 text-center">
            <h3 className="font-serif text-2xl font-light text-[#2C2C2C]">Confirm acceptance</h3>
            <p className="mt-4 text-sm text-[#666]">
              By accepting, you agree to proceed with the package outlined in this proposal.
            </p>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setShowAcceptConfirm(false)} className="flex-1 border border-[#CCC] py-3 text-xs uppercase tracking-wider">
                Cancel
              </button>
              <button type="button" disabled={actionBusy} onClick={accept} className="flex-1 bg-[#2C2C2C] py-3 text-xs uppercase tracking-wider text-white">
                {actionBusy ? "…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
