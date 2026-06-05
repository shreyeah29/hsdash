import { PACKAGE_NOTES } from "@/lib/quotationTemplate";
import type { Quotation } from "@/types/quotation";

function PaymentLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="qb-package-block">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

export function PackageBrochurePage({ quotation }: { quotation: Quotation }) {
  const notes = quotation.additionalNotes
    ? [quotation.additionalNotes]
    : PACKAGE_NOTES;

  return (
    <section className="quotation-brochure-page">
      <div className="quotation-brochure-dynamic qb-package">
        <div className="qb-package-bg" aria-hidden />
        <div className="qb-package-content">
          <h2>Package</h2>
          <p className="qb-package-amount">{quotation.packageAmount}</p>

          <PaymentLine label="Booking Amount" value={quotation.bookingAmount} />
          <PaymentLine label="Second Payment" value={quotation.secondPayment} />
          <PaymentLine label="Final Payment" value={quotation.finalPayment} />

          {quotation.includeEngagementPackage ? (
            <div className="qb-package-engagement">
              <h2 style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)", letterSpacing: "0.25em" }}>
                Engagement Package
              </h2>
              <p className="qb-package-amount">{quotation.engagementPackageAmount}</p>
              <PaymentLine label="Booking Amount" value={quotation.engagementBookingAmount} />
              <PaymentLine label="Final Payment" value={quotation.engagementFinalPayment} />
            </div>
          ) : null}

          <div className="qb-package-notes">
            <h4>Note</h4>
            <ul>
              {notes.map((n) => (
                <li key={n.slice(0, 40)}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
