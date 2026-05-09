import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireCoordinatorOnly, requireCoordinatorOrAdmin } from "../middleware/coordinator";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";
import { buildEventTasks } from "../services/eventTasks";

export const productionCalendarRouter = Router();

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const entryInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  event: {
    include: {
      tasks: {
        orderBy: [{ deadline: "asc" as const }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true, team: true } },
        },
      },
    },
  },
} satisfies Prisma.ShootCalendarEntryInclude;

productionCalendarRouter.use(requireAuth);

productionCalendarRouter.get("/entries", requireCoordinatorOrAdmin, async (req, res, next) => {
  try {
    const q = z
      .object({
        from: isoDay,
        to: isoDay,
      })
      .parse(req.query);

    const from = parseDayUtc(q.from);
    const to = parseDayUtc(q.to);
    if (to.getTime() < from.getTime()) throw new HttpError(400, "Invalid range", "BAD_REQUEST");

    const entries = await prisma.shootCalendarEntry.findMany({
      where: {
        day: { gte: from, lte: to },
      },
      orderBy: [{ day: "asc" }, { createdAt: "asc" }],
      include: entryInclude,
    });

    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

const baseFields = z.object({
  day: isoDay,
  clientName: z.string().min(1),
  clientType: z.string().max(200).optional().default(""),
  eventName: z.string().max(300).optional().default(""),
  startTime: z.string().max(50).optional().default(""),
  endTime: z.string().max(50).optional().default(""),
  photoTeam: z.string().max(4000).optional().default(""),
  videoTeam: z.string().max(4000).optional().default(""),
  addons: z.string().max(8000).optional().default(""),
  createDeliverableTimeline: z.boolean().optional().default(false),
});

productionCalendarRouter.post("/entries", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = baseFields.parse(req.body);
    const auth = req.auth!;

    const entry = await prisma.$transaction(async (tx) => {
      let eventId: string | null = null;
      if (body.createDeliverableTimeline) {
        const eventDate = parseDayUtc(body.day);
        const ev = await tx.event.create({
          data: {
            clientName: body.clientName,
            eventDate,
          },
        });
        eventId = ev.id;
        const rows = buildEventTasks(ev.id, ev.eventDate);
        for (const row of rows) {
          await tx.task.create({ data: row });
        }
      }

      return tx.shootCalendarEntry.create({
        data: {
          day: parseDayUtc(body.day),
          clientName: body.clientName,
          clientType: body.clientType ?? "",
          eventName: body.eventName ?? "",
          startTime: body.startTime ?? "",
          endTime: body.endTime ?? "",
          photoTeam: body.photoTeam ?? "",
          videoTeam: body.videoTeam ?? "",
          addons: body.addons ?? "",
          createdById: auth.userId,
          eventId,
        },
        include: entryInclude,
      });
    });

    res.status(201).json({ entry });
  } catch (e) {
    next(e);
  }
});

const patchSchema = baseFields.partial().extend({
  createDeliverableTimeline: z.boolean().optional(),
});

productionCalendarRouter.put("/entries/:id", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = patchSchema.parse(req.body);

    const existing = await prisma.shootCalendarEntry.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Entry not found", "NOT_FOUND");

    const entry = await prisma.$transaction(async (tx) => {
      let eventId = existing.eventId;

      if (body.createDeliverableTimeline === true && !eventId) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const dayStr =
          typeof body.day === "string"
            ? body.day
            : `${existing.day.getUTCFullYear()}-${pad(existing.day.getUTCMonth() + 1)}-${pad(existing.day.getUTCDate())}`;
        const clientName = body.clientName ?? existing.clientName;
        const eventDate = parseDayUtc(dayStr);
        const ev = await tx.event.create({
          data: { clientName, eventDate },
        });
        eventId = ev.id;
        const rows = buildEventTasks(ev.id, ev.eventDate);
        for (const row of rows) {
          await tx.task.create({ data: row });
        }
      }

      const nextDay = body.day ? parseDayUtc(body.day) : undefined;

      if (eventId && body.clientName !== undefined) {
        await tx.event.update({
          where: { id: eventId },
          data: { clientName: body.clientName },
        });
      }

      return tx.shootCalendarEntry.update({
        where: { id },
        data: {
          ...(nextDay ? { day: nextDay } : {}),
          ...(body.clientName !== undefined ? { clientName: body.clientName } : {}),
          ...(body.clientType !== undefined ? { clientType: body.clientType } : {}),
          ...(body.eventName !== undefined ? { eventName: body.eventName } : {}),
          ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
          ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
          ...(body.photoTeam !== undefined ? { photoTeam: body.photoTeam } : {}),
          ...(body.videoTeam !== undefined ? { videoTeam: body.videoTeam } : {}),
          ...(body.addons !== undefined ? { addons: body.addons } : {}),
          ...(eventId !== existing.eventId ? { eventId } : {}),
        },
        include: entryInclude,
      });
    });

    res.json({ entry });
  } catch (e) {
    next(e);
  }
});

productionCalendarRouter.delete("/entries/:id", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const existing = await prisma.shootCalendarEntry.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Entry not found", "NOT_FOUND");

    await prisma.$transaction(async (tx) => {
      if (existing.eventId) {
        await tx.event.delete({ where: { id: existing.eventId } });
      }
      await tx.shootCalendarEntry.delete({ where: { id } });
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

productionCalendarRouter.get("/team-members", requireCoordinatorOnly, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      select: { id: true, name: true, email: true, team: true, designation: true },
      orderBy: [{ team: "asc" }, { name: "asc" }],
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});
