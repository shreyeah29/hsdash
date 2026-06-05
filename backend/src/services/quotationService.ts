import crypto from "crypto";
import {
  LeadActivityKind,
  LeadStatus,
  QuotationStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";

export type QuotationEventInput = {
  eventName: string;
  venue?: string;
  eventDate: string;
  teamSize?: string;
  duration?: string;
  notes?: string;
};

export type CreateQuotationInput = {
  packageAmount: string;
  bookingAmount: string;
  secondPayment?: string;
  finalPayment?: string;
  additionalNotes?: string;
  includeEngagementPackage?: boolean;
  engagementPackageAmount?: string;
  engagementBookingAmount?: string;
  engagementFinalPayment?: string;
  expiresAt: string;
  events: QuotationEventInput[];
};

function generateSlug(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
}

async function recordLeadActivity(
  tx: Prisma.TransactionClient,
  leadId: string,
  kind: LeadActivityKind,
  opts: {
    message?: string;
    actorUserId?: string;
    previousStatus?: LeadStatus;
    newStatus?: LeadStatus;
  } = {},
) {
  await tx.leadActivity.create({
    data: {
      leadId,
      kind,
      message: opts.message ?? "",
      actorUserId: opts.actorUserId,
      previousStatus: opts.previousStatus,
      newStatus: opts.newStatus,
    },
  });
}

async function notifyAdmins(title: string, body: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (!admins.length) return;
  await prisma.userNotification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, body })),
  });
}

export const quotationInclude = {
  events: { orderBy: { sortOrder: "asc" as const } },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.QuotationInclude;

function resolveClientName(lead: {
  eventType: string;
  brideName: string;
  groomName: string;
  clientName: string;
  name: string;
}) {
  if (lead.eventType === "WEDDING") {
    const b = lead.brideName.trim();
    const g = lead.groomName.trim();
    if (b && g) return `${b} & ${g}`;
    if (b || g) return b || g;
  }
  return lead.clientName.trim() || lead.name.trim() || "Client";
}

export async function createQuotation(leadId: string, input: CreateQuotationInput, adminUserId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new HttpError(404, "Lead not found");

  const version = (await prisma.quotation.count({ where: { leadId } })) + 1;
  let slug = generateSlug();
  while (await prisma.quotation.findUnique({ where: { slug } })) {
    slug = generateSlug();
  }

  const now = new Date();
  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) throw new HttpError(400, "Invalid expiry date");

  return prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data: {
        leadId,
        version,
        slug,
        status: QuotationStatus.ACTIVE,
        clientName: resolveClientName(lead),
        phoneNumber: lead.phoneNumber,
        email: lead.email,
        packageAmount: input.packageAmount.trim(),
        bookingAmount: input.bookingAmount.trim(),
        secondPayment: input.secondPayment?.trim() ?? "",
        finalPayment: input.finalPayment?.trim() ?? "",
        additionalNotes: input.additionalNotes?.trim() ?? "",
        includeEngagementPackage: input.includeEngagementPackage ?? false,
        engagementPackageAmount: input.engagementPackageAmount?.trim() ?? "",
        engagementBookingAmount: input.engagementBookingAmount?.trim() ?? "",
        engagementFinalPayment: input.engagementFinalPayment?.trim() ?? "",
        expiresAt,
        sentAt: now,
        createdById: adminUserId,
        events: {
          create: input.events.map((e, i) => ({
            sortOrder: i,
            eventName: e.eventName.trim(),
            venue: e.venue?.trim() ?? "",
            eventDate: parseDayUtc(e.eventDate),
            teamSize: e.teamSize?.trim() ?? "",
            duration: e.duration?.trim() ?? "",
            notes: e.notes?.trim() ?? "",
          })),
        },
      },
      include: quotationInclude,
    });

    await recordLeadActivity(tx, leadId, LeadActivityKind.QUOTATION_CREATED, {
      actorUserId: adminUserId,
      message: `Quotation v${version} created — ${quotation.slug}`,
    });
    await recordLeadActivity(tx, leadId, LeadActivityKind.QUOTATION_SENT, {
      actorUserId: adminUserId,
      message: `Quotation v${version} sent`,
    });

    if (lead.status !== LeadStatus.NEGOTIATION) {
      await tx.lead.update({ where: { id: leadId }, data: { status: LeadStatus.NEGOTIATION } });
      await recordLeadActivity(tx, leadId, LeadActivityKind.STATUS_CHANGED, {
        actorUserId: adminUserId,
        previousStatus: lead.status,
        newStatus: LeadStatus.NEGOTIATION,
        message: "Moved to Negotiation for quotation",
      });
    }

    return quotation;
  });
}

export async function getQuotationBySlug(slug: string) {
  const q = await prisma.quotation.findUnique({
    where: { slug: slug.toUpperCase() },
    include: quotationInclude,
  });
  if (!q) throw new HttpError(404, "Quotation not found");

  if (q.status === QuotationStatus.ACTIVE && q.expiresAt < new Date()) {
    await prisma.quotation.update({
      where: { id: q.id },
      data: { status: QuotationStatus.EXPIRED },
    });
    q.status = QuotationStatus.EXPIRED;
  }

  return q;
}

export async function trackQuotationView(slug: string, viewerKey: string, userAgent: string) {
  const q = await getQuotationBySlug(slug);
  const now = new Date();
  const isFirst = q.viewCount === 0;

  await prisma.$transaction(async (tx) => {
    await tx.quotationView.create({
      data: { quotationId: q.id, viewerKey, userAgent: userAgent.slice(0, 500) },
    });
    await tx.quotation.update({
      where: { id: q.id },
      data: {
        viewCount: { increment: 1 },
        firstViewedAt: isFirst ? now : q.firstViewedAt,
        lastViewedAt: now,
      },
    });
    if (isFirst) {
      await recordLeadActivity(tx, q.leadId, LeadActivityKind.QUOTATION_VIEWED, {
        message: `Quotation v${q.version} opened for the first time`,
      });
    }
  });

  return prisma.quotation.findUnique({ where: { id: q.id }, include: quotationInclude });
}

export async function acceptQuotation(slug: string) {
  const q = await getQuotationBySlug(slug);
  if (q.status === QuotationStatus.ACCEPTED) return q;
  if (q.status === QuotationStatus.EXPIRED) {
    throw new HttpError(410, "This quotation has expired");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.update({
      where: { id: q.id },
      data: { status: QuotationStatus.ACCEPTED, acceptedAt: new Date() },
      include: quotationInclude,
    });
    await tx.lead.update({
      where: { id: q.leadId },
      data: { status: LeadStatus.CONFIRMED },
    });
    await recordLeadActivity(tx, q.leadId, LeadActivityKind.QUOTATION_ACCEPTED, {
      message: `Quotation v${q.version} accepted by client`,
      newStatus: LeadStatus.CONFIRMED,
    });
    await recordLeadActivity(tx, q.leadId, LeadActivityKind.STATUS_CHANGED, {
      previousStatus: LeadStatus.NEGOTIATION,
      newStatus: LeadStatus.CONFIRMED,
      message: "Lead confirmed via quotation acceptance",
    });
    return quotation;
  });

  await notifyAdmins(
    "Quotation accepted",
    `${q.clientName} accepted quotation v${q.version} (${q.packageAmount})`,
  );

  return updated;
}

export async function requestQuotationRevision(slug: string, message?: string) {
  const q = await getQuotationBySlug(slug);
  if (q.status === QuotationStatus.EXPIRED) {
    throw new HttpError(410, "This quotation has expired");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.update({
      where: { id: q.id },
      data: {
        status: QuotationStatus.REVISION_REQUESTED,
        revisionRequestedAt: new Date(),
        revisionMessage: message?.trim() ?? "",
      },
      include: quotationInclude,
    });
    await recordLeadActivity(tx, q.leadId, LeadActivityKind.QUOTATION_REVISION_REQUESTED, {
      message: message?.trim() || `Revision requested on quotation v${q.version}`,
    });
    return quotation;
  });

  await notifyAdmins(
    "Revision requested",
    `${q.clientName} requested changes on quotation v${q.version}`,
  );

  return updated;
}

export async function listQuotationsForLead(leadId: string) {
  return prisma.quotation.findMany({
    where: { leadId },
    orderBy: { version: "desc" },
    include: quotationInclude,
  });
}
