import { getPublicSiteUrl } from "@/lib/enquiryUrl";

export function getQuotationPublicUrl(slug: string) {
  return `${getPublicSiteUrl()}/q/${slug}`;
}

export function quotationWhatsAppMessage(clientName: string, url: string) {
  return `Dear ${clientName},\n\nPlease find your personalised wedding photography proposal from Harishankar Photography:\n\n${url}\n\nWe look forward to being part of your celebration.`;
}
