import type { Prisma } from "@prisma/client";
import { parseDayUtc } from "../utils/calendarDay";

/** Payload aligned with Add Shoot Details / POST /production-calendar/entries */
export type ShootEntryCreateInput = {
  day: string;
  clientName: string;
  brideName?: string;
  groomName?: string;
  phoneNumber?: string;
  clientType?: string;
  clientContact?: string;
  city?: string;
  eventName?: string;
  venue?: string;
  startTime?: string;
  endTime?: string;
  muhuruthamTime?: string;
  photoTeam?: string;
  videoTeam?: string;
  addons?: string;
  createDeliverableTimeline?: boolean;
};

export type ShootEntryCreateResult = {
  entryId: string;
  eventId: string | null;
};

/**
 * Creates one shoot calendar row — same shape as manual Add Shoot Details
 * without activating post-production unless requested.
 */
export async function createShootCalendarEntryTx(
  tx: Prisma.TransactionClient,
  input: ShootEntryCreateInput,
  createdById: string,
): Promise<ShootEntryCreateResult> {
  const created = await tx.shootCalendarEntry.create({
    data: {
      day: parseDayUtc(input.day),
      clientName: input.clientName.trim(),
      brideName: input.brideName?.trim() ?? "",
      groomName: input.groomName?.trim() ?? "",
      phoneNumber: input.phoneNumber?.trim() ?? "",
      clientType: input.clientType?.trim() ?? "",
      clientContact: input.clientContact?.trim() ?? "",
      city: input.city?.trim() ?? "",
      eventName: input.eventName?.trim() ?? "",
      venue: input.venue?.trim() ?? "",
      startTime: input.startTime?.trim() ?? "",
      endTime: input.endTime?.trim() ?? "",
      muhuruthamTime: input.muhuruthamTime?.trim() ?? "",
      photoTeam: input.photoTeam?.trim() ?? "",
      videoTeam: input.videoTeam?.trim() ?? "",
      addons: input.addons?.trim() ?? "",
      createdById,
      eventId: null,
    },
    select: { id: true, eventId: true },
  });

  return { entryId: created.id, eventId: created.eventId };
}
