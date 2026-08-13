import {
  CareerApplicationSource,
  CareerApplicationStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/httpError";
import { normalizePhone } from "../utils/phone";

export type CareerApplicationInput = {
  name?: string;
  email?: string;
  phoneNumber: string;
  roleApplied: string;
  softwares?: string;
  experience?: string;
  portfolioUrl?: string;
  instagramLink?: string;
  notes?: string;
  status?: CareerApplicationStatus;
  source?: CareerApplicationSource;
  externalId?: string | null;
  submittedAt?: Date;
};

export const careerSelect = {
  id: true,
  status: true,
  source: true,
  name: true,
  email: true,
  phoneNumber: true,
  phoneNormalized: true,
  roleApplied: true,
  softwares: true,
  experience: true,
  portfolioUrl: true,
  instagramLink: true,
  notes: true,
  externalId: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CareerApplicationSelect;

export async function createCareerApplication(input: CareerApplicationInput) {
  const phoneNumber = input.phoneNumber.trim();
  const phoneNormalized = phoneNumber ? normalizePhone(phoneNumber) : "";
  const externalId = input.externalId?.trim() || null;

  if (externalId) {
    const existing = await prisma.careerApplication.findUnique({ where: { externalId } });
    if (existing) return existing;
  }

  // Soft duplicate guard for rapid resubmits (same phone + role within 24h).
  if (phoneNormalized) {
    const recent = await prisma.careerApplication.findFirst({
      where: {
        phoneNormalized,
        roleApplied: input.roleApplied.trim(),
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recent && !externalId) return recent;
  }

  return prisma.careerApplication.create({
    data: {
      status: input.status ?? CareerApplicationStatus.NEW,
      source: input.source ?? CareerApplicationSource.GOOGLE_FORM,
      name: input.name?.trim() ?? "",
      email: input.email?.trim() ?? "",
      phoneNumber,
      phoneNormalized,
      roleApplied: input.roleApplied.trim(),
      softwares: input.softwares?.trim() ?? "",
      experience: input.experience?.trim() ?? "",
      portfolioUrl: input.portfolioUrl?.trim() ?? "",
      instagramLink: input.instagramLink?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      externalId,
      submittedAt: input.submittedAt ?? new Date(),
    },
    select: careerSelect,
  });
}

export async function updateCareerApplication(
  id: string,
  data: {
    status?: CareerApplicationStatus;
    notes?: string;
  },
) {
  const existing = await prisma.careerApplication.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Application not found");

  return prisma.careerApplication.update({
    where: { id },
    data: {
      status: data.status,
      notes: data.notes !== undefined ? data.notes.trim() : undefined,
    },
    select: careerSelect,
  });
}

export async function deleteCareerApplication(id: string) {
  const existing = await prisma.careerApplication.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Application not found");
  await prisma.careerApplication.delete({ where: { id } });
}

export function mapHiringSheetStatus(raw: string): CareerApplicationStatus {
  const s = raw.trim().toUpperCase();
  if (s.includes("SHORTLIST")) return CareerApplicationStatus.SHORTLISTED;
  if (s.includes("REJECT")) return CareerApplicationStatus.REJECTED;
  if (s.includes("HIRE")) return CareerApplicationStatus.HIRED;
  if (s.includes("REVIEW") || s.includes("INTERVIEW")) return CareerApplicationStatus.REVIEWING;
  if (s.includes("ARCHIVE")) return CareerApplicationStatus.ARCHIVED;
  return CareerApplicationStatus.NEW;
}
