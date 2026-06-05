import {
  LeadActivityKind,
  LeadEventType,
  LeadSource,
  LeadStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/httpError";
import { normalizePhone } from "../utils/phone";
import { parseDayUtc } from "../utils/calendarDay";
import { createShootCalendarEntryTx } from "./shootCalendarEntryService";

export type PublicLeadInput = {
  phoneNumber: string;
  email?: string;
  eventDate: string;
  eventLocation: string;
  eventType: LeadEventType;
  name?: string;
  brideName?: string;
  groomName?: string;
  clientName?: string;
  message?: string;
};

export type ManualLeadInput = PublicLeadInput & {
  source?: LeadSource;
  status?: LeadStatus;
};

function resolveClientLabel(input: {
  eventType: LeadEventType;
  name: string;
  brideName: string;
  groomName: string;
  clientName: string;
}): string {
  if (input.eventType === LeadEventType.WEDDING) {
    const b = input.brideName.trim();
    const g = input.groomName.trim();
    if (b && g) return `${b} & ${g}`;
    if (b) return b;
    if (g) return g;
    return input.name.trim();
  }
  return input.clientName.trim() || input.name.trim();
}

async function recordActivity(
  tx: Prisma.TransactionClient,
  leadId: string,
  kind: LeadActivityKind,
  opts: {
    message?: string;
    previousStatus?: LeadStatus | null;
    newStatus?: LeadStatus | null;
    actorUserId?: string | null;
  } = {},
) {
  await tx.leadActivity.create({
    data: {
      leadId,
      kind,
      message: opts.message ?? "",
      previousStatus: opts.previousStatus ?? undefined,
      newStatus: opts.newStatus ?? undefined,
      actorUserId: opts.actorUserId ?? undefined,
    },
  });
}

export async function createLeadFromPublic(input: PublicLeadInput) {
  const phoneNormalized = normalizePhone(input.phoneNumber);
  const recent = await prisma.lead.findFirst({
    where: {
      phoneNormalized,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });
  if (recent) {
    throw new HttpError(429, "We already received your enquiry recently. Our team will contact you soon.");
  }

  const brideName = input.brideName?.trim() ?? "";
  const groomName = input.groomName?.trim() ?? "";
  const clientName = input.clientName?.trim() ?? "";
  const name = input.name?.trim() ?? "";

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
        eventType: input.eventType,
        name,
        email: input.email?.trim() ?? "",
        phoneNumber: input.phoneNumber.trim(),
        phoneNormalized,
        eventDate: parseDayUtc(input.eventDate),
        eventLocation: input.eventLocation.trim(),
        brideName,
        groomName,
        clientName,
        message: input.message?.trim() ?? "",
      },
    });
    await recordActivity(tx, lead.id, LeadActivityKind.CREATED, {
      message: "Lead created from website enquiry",
    });
    return lead;
  });
}

export async function createLeadManual(input: ManualLeadInput, actorUserId: string) {
  const phoneNormalized = normalizePhone(input.phoneNumber);
  const brideName = input.brideName?.trim() ?? "";
  const groomName = input.groomName?.trim() ?? "";
  const clientName = input.clientName?.trim() ?? "";
  const name = input.name?.trim() ?? "";

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        status: input.status ?? LeadStatus.NEW,
        source: input.source ?? LeadSource.MANUAL,
        eventType: input.eventType,
        name,
        email: input.email?.trim() ?? "",
        phoneNumber: input.phoneNumber.trim(),
        phoneNormalized,
        eventDate: parseDayUtc(input.eventDate),
        eventLocation: input.eventLocation.trim(),
        brideName,
        groomName,
        clientName,
        message: input.message?.trim() ?? "",
      },
    });
    await recordActivity(tx, lead.id, LeadActivityKind.CREATED, {
      message: "Lead created manually",
      actorUserId,
    });
    return lead;
  });
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  actorUserId: string,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new HttpError(404, "Lead not found");
  if (lead.status === status) return lead;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { status },
    });
    await recordActivity(tx, leadId, LeadActivityKind.STATUS_CHANGED, {
      previousStatus: lead.status,
      newStatus: status,
      actorUserId,
      message: `Status changed to ${status}`,
    });
    return updated;
  });
}

export async function assignLead(leadId: string, assignedToId: string | null, actorUserId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new HttpError(404, "Lead not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { assignedToId },
    });
    await recordActivity(tx, leadId, LeadActivityKind.ASSIGNED, {
      actorUserId,
      message: assignedToId ? "Lead assigned to staff" : "Lead unassigned",
    });
    return updated;
  });
}

export async function addLeadNote(leadId: string, content: string, authorId: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new HttpError(400, "Note cannot be empty");

  return prisma.$transaction(async (tx) => {
    const note = await tx.leadNote.create({
      data: { leadId, content: trimmed, authorId },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    await recordActivity(tx, leadId, LeadActivityKind.NOTE_ADDED, {
      actorUserId: authorId,
      message: trimmed.slice(0, 200),
    });
    return note;
  });
}

async function findExistingClientByPhone(tx: Prisma.TransactionClient, phoneNormalized: string) {
  const rows = await tx.shootCalendarEntry.findMany({
    where: { phoneNumber: { not: "" } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      clientName: true,
      brideName: true,
      groomName: true,
      phoneNumber: true,
      clientType: true,
      city: true,
    },
  });
  return rows.find((r) => normalizePhone(r.phoneNumber) === phoneNormalized) ?? null;
}

function dayKeyFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert confirmed lead → shoot calendar entry (reuses Add Shoot Details logic). */
export async function convertLeadToClient(leadId: string, adminUserId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new HttpError(404, "Lead not found");
  if (lead.convertedEntryId) {
    throw new HttpError(400, "Lead already converted");
  }
  if (lead.status !== LeadStatus.CONFIRMED) {
    throw new HttpError(400, "Lead must be Confirmed before conversion");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await findExistingClientByPhone(tx, lead.phoneNormalized);

    let clientName = resolveClientLabel(lead);
    let brideName = lead.brideName;
    let groomName = lead.groomName;

    if (existing) {
      if (!clientName) clientName = existing.clientName;
      if (!brideName) brideName = existing.brideName;
      if (!groomName) groomName = existing.groomName;
    }

    const result = await createShootCalendarEntryTx(
      tx,
      {
        day: dayKeyFromDate(lead.eventDate),
        clientName: clientName || "Client",
        brideName,
        groomName,
        phoneNumber: lead.phoneNumber,
        clientContact: lead.email.trim(),
        clientType: lead.eventType === LeadEventType.WEDDING ? "Wedding" : "Other",
        city: lead.eventLocation,
        venue: lead.eventLocation,
        eventName: lead.eventType === LeadEventType.WEDDING ? "Wedding" : "Event",
        addons: lead.message,
      },
      adminUserId,
    );

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        convertedEntryId: result.entryId,
        convertedAt: new Date(),
      },
    });

    await recordActivity(tx, leadId, LeadActivityKind.CONVERTED, {
      actorUserId: adminUserId,
      message: `Converted to calendar entry ${result.entryId}`,
    });

    return { lead: updated, entryId: result.entryId };
  });
}

export const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true, team: true } },
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true, email: true } } },
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    include: { actor: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.LeadInclude;
