import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import type { Quotation } from "@/types/quotation";
import { LuxuryQuotationView } from "./LuxuryQuotationView";
import "./luxury-quotation.css";

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
      <div className="lq flex min-h-screen items-center justify-center px-6 text-center">
        <p>{error}</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="lq flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <LuxuryQuotationView
        quotation={quotation}
        accepted={accepted}
        revisionSent={revisionSent}
        expired={expired}
        canAct={!!canAct}
        actionBusy={actionBusy}
        onAcceptClick={() => setShowAcceptConfirm(true)}
        onRequestRevision={requestRevision}
      />

      {showAcceptConfirm ? (
        <div className="lq-modal-backdrop">
          <div className="lq-modal">
            <h3 className="lq-serif">Confirm acceptance</h3>
            <p>By accepting, you agree to proceed with the package outlined in this proposal.</p>
            <div className="lq-modal-actions">
              <button type="button" onClick={() => setShowAcceptConfirm(false)} className="lq-btn-outline">
                Cancel
              </button>
              <button type="button" disabled={actionBusy} onClick={accept} className="lq-btn-gold">
                {actionBusy ? "…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
