import { PACKAGE_NOTES, QUOTATION_PAGES } from "@/lib/quotationTemplate";
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
  const notes = quotation.additionalNotes ? [quotation.additionalNotes] : PACKAGE_NOTES;

  return (
    <section className="quotation-brochure-page">
      <div className="quotation-brochure-dynamic qb-package-page">
        <img src={QUOTATION_PAGES.package} alt="" className="qb-pdf-bg" aria-hidden />
        <div className="qb-package-content-mask" aria-hidden />

        <div className="qb-package-overlay">
          <div className="qb-package-inner">
            <div className="qb-package-main">
              <h2 className="qb-package-title">Package</h2>
              <p className="qb-package-amount">{quotation.packageAmount}</p>

              <div className="qb-package-payments">
                <PaymentLine label="Booking Amount" value={quotation.bookingAmount} />
                <PaymentLine label="Second Payment" value={quotation.secondPayment} />
                <PaymentLine label="Final Payment" value={quotation.finalPayment} />
              </div>

              {quotation.includeEngagementPackage ? (
                <div className="qb-package-engagement">
                  <h2 className="qb-package-title">Engagement Package</h2>
                  <p className="qb-package-amount">{quotation.engagementPackageAmount}</p>
                  <div className="qb-package-payments">
                    <PaymentLine label="Booking Amount" value={quotation.engagementBookingAmount} />
                    <PaymentLine label="Final Payment" value={quotation.engagementFinalPayment} />
                  </div>
                </div>
              ) : null}
            </div>

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
      </div>
    </section>
  );
}
