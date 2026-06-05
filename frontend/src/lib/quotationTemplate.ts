/** Public quotation brochure — pages 1, 6, 7, 8 from Lalitha & Anish reference PDF. */

/** Full-page renders (A4 ratio 595.5×842.25) served from /public/quotation */
export const QUOTATION_PAGES = {
  cover: "/quotation/page-01.png",
  /** Full PDF page 6 — static title/footnote show through; events are overlaid. */
  events: "/quotation/page-06.png",
  /** Full PDF page 7 — decorative corners show through; package copy is overlaid. */
  package: "/quotation/page-07.png",
  /** Full PDF page 8 — static add-ons table. */
  addons: "/quotation/page-08.png",
} as const;

export const PACKAGE_NOTES = [
  "The mentioned package will be personally covered by Harish/Shankar.",
  "If you choose to proceed with only the Engagement package, an Engagement album will be included.",
  "Drone charges are not included in the package and will be billed as per actuals, as detailed under the add-ons section.",
];

export const EVENTS_FOOTNOTE =
  "TEAM SIZE: INCLUSIVE OF LEAD PHOTOGRAPHER, CANDID & TRADITIONAL PHOTOGRAPHER AND VIDEOGRAPHER";

export const DEFAULT_PACKAGE = {
  packageAmount: "12.85 Lakhs + 18% GST",
  bookingAmount: "8,00,000/- (to securely block the dates for you)",
  secondPayment: "4,50,000/- (to be paid before 45 days of the first event)",
  finalPayment: "35,000/- (before collecting any deliverables)",
  engagementPackageAmount: "3.45 Lakhs + 18% GST",
  engagementBookingAmount: "3,00,000/- (to securely block the dates for you)",
  engagementFinalPayment: "45,000/- (before collecting any deliverables)",
};
