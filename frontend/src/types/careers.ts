export const CareerApplicationStatus = {
  NEW: "NEW",
  REVIEWING: "REVIEWING",
  SHORTLISTED: "SHORTLISTED",
  REJECTED: "REJECTED",
  HIRED: "HIRED",
  ARCHIVED: "ARCHIVED",
} as const;
export type CareerApplicationStatus =
  (typeof CareerApplicationStatus)[keyof typeof CareerApplicationStatus];

export const CareerApplicationSource = {
  GOOGLE_FORM: "GOOGLE_FORM",
  WEBSITE: "WEBSITE",
  MANUAL: "MANUAL",
  IMPORT: "IMPORT",
} as const;
export type CareerApplicationSource =
  (typeof CareerApplicationSource)[keyof typeof CareerApplicationSource];

export type CareerApplication = {
  id: string;
  status: CareerApplicationStatus;
  source: CareerApplicationSource;
  name: string;
  email: string;
  phoneNumber: string;
  phoneNormalized: string;
  roleApplied: string;
  softwares: string;
  experience: string;
  portfolioUrl: string;
  instagramLink: string;
  notes: string;
  externalId: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CareerStats = {
  total: number;
  new: number;
  reviewing: number;
  shortlisted: number;
  rejected: number;
  hired: number;
  archived: number;
};

export const CAREER_STATUS_LABELS: Record<CareerApplicationStatus, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  HIRED: "Hired",
  ARCHIVED: "Archived",
};

export const CAREER_STATUS_COLORS: Record<CareerApplicationStatus, string> = {
  NEW: "bg-violet-100 text-violet-800 border-violet-200",
  REVIEWING: "bg-blue-50 text-blue-800 border-blue-200",
  SHORTLISTED: "bg-amber-50 text-amber-900 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  HIRED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
};
