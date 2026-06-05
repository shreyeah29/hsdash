/** Public marketing site — enquiry form lives here (not on the API host). */
export function getPublicSiteUrl() {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://hsdash.vercel.app";
}

export function getEnquiryUrl() {
  return `${getPublicSiteUrl()}/enquiry`;
}

export function enquiryShareMessage(url = getEnquiryUrl()) {
  return `Thank you for contacting HS Photography. Please fill out our enquiry form and we'll get back to you shortly:\n${url}`;
}
