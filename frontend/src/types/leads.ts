export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  NEGOTIATION: "NEGOTIATION",
  CONFIRMED: "CONFIRMED",
  LOST: "LOST",
  ARCHIVED: "ARCHIVED",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  WEBSITE: "WEBSITE",
  WHATSAPP: "WHATSAPP",
  INSTAGRAM: "INSTAGRAM",
  FACEBOOK: "FACEBOOK",
  REFERRAL: "REFERRAL",
  MANUAL: "MANUAL",
  GOOGLE: "GOOGLE",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadEventType = {
  WEDDING: "WEDDING",
  OTHER: "OTHER",
} as const;
export type LeadEventType = (typeof LeadEventType)[keyof typeof LeadEventType];

export type LeadSummary = {
  id: string;
  status: LeadStatus;
  source: LeadSource;
  eventType: LeadEventType;
  name: string;
  phoneNumber: string;
  eventDate: string;
  eventLocation: string;
  brideName: string;
  groomName: string;
  clientName: string;
  message: string;
  assignedToId: string | null;
  assignedTo?: { id: string; name: string } | null;
  convertedEntryId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadNote = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string };
};

export type LeadActivity = {
  id: string;
  kind: string;
  message: string;
  previousStatus: LeadStatus | null;
  newStatus: LeadStatus | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
};

export type LeadDetail = LeadSummary & {
  notes: LeadNote[];
  activities: LeadActivity[];
  assignedTo?: { id: string; name: string; email: string; team: string | null } | null;
};

export type LeadStats = {
  total: number;
  new: number;
  contacted: number;
  negotiation: number;
  confirmed: number;
  lost: number;
  archived: number;
  converted: number;
  conversionRate: number;
  sources: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  NEGOTIATION: "Negotiation",
  CONFIRMED: "Confirmed",
  LOST: "Lost",
  ARCHIVED: "Archived",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-violet-100 text-violet-800 border-violet-200",
  CONTACTED: "bg-blue-50 text-blue-800 border-blue-200",
  NEGOTIATION: "bg-amber-50 text-amber-900 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  LOST: "bg-rose-50 text-rose-800 border-rose-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  REFERRAL: "Referral",
  MANUAL: "Manual",
  GOOGLE: "Google",
};
