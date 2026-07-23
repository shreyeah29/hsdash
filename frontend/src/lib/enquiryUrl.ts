/** App / quotation host (admin dashboard). */
export function getPublicSiteUrl() {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://hsdash.vercel.app";
}

/** Marketing site enquiry form — lives on hswf.in (not the dashboard host). */
export function getEnquiryUrl() {
  const fromEnv = import.meta.env.VITE_ENQUIRY_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, "");
  return "https://www.hswf.in/enquiry";
}

export function enquiryShareMessage(url = getEnquiryUrl()) {
  return `Thank you for contacting HS Photography. Please fill out our enquiry form and we'll get back to you shortly:\n${url}`;
}
