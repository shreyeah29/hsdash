import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Role, Team, TaskType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireCoordinator, requireCoordinatorOrAdmin } from "../middleware/coordinator";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";
import { createEventTasksTx, type EventTaskAssignments } from "../services/eventTasks";
import { syncEventAssignmentsTx } from "../services/eventAssignment";
import { notifyAllAssignedTasksTx, pulseAssigneesImmediate } from "../services/assignmentNotify";
import { emitTaskRefreshToOps } from "../realtime/socket";
import { calendarTaskProgressSelect } from "../services/prismaSelects";

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

/** Lighter payload for dashboard widgets (status + deadlines only). */
const entryDashboardInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  event: {
    include: {
      tasks: {
        orderBy: [{ deadline: "asc" as const }],
        select: calendarTaskProgressSelect,
      },
    },
  },
} satisfies Prisma.ShootCalendarEntryInclude;

function editorIdFromBody(value: string | undefined): string | null {
  const id = value?.trim();
  return id ? id : null;
}

/** Full map for new events (missing lanes = unassigned). */
function assignmentsFromBody(body: {
  photoEditorId?: string;
  cinematicEditorId?: string;
  traditionalEditorId?: string;
  albumEditorId?: string;
}): EventTaskAssignments {
  return {
    [Team.PHOTO_TEAM]: editorIdFromBody(body.photoEditorId),
    [Team.CINEMATIC_TEAM]: editorIdFromBody(body.cinematicEditorId),
    [Team.TRADITIONAL_TEAM]: editorIdFromBody(body.traditionalEditorId),
    [Team.ALBUM_TEAM]: editorIdFromBody(body.albumEditorId),
  };
}

/** Only lanes the client sent — avoids wiping teams omitted from a partial PUT body. */
function explicitAssignmentsFromBody(body: {
  photoEditorId?: string;
  cinematicEditorId?: string;
  traditionalEditorId?: string;
  albumEditorId?: string;
}): EventTaskAssignments {
  const out: EventTaskAssignments = {};
  if ("photoEditorId" in body) out[Team.PHOTO_TEAM] = editorIdFromBody(body.photoEditorId);
  if ("cinematicEditorId" in body) out[Team.CINEMATIC_TEAM] = editorIdFromBody(body.cinematicEditorId);
  if ("traditionalEditorId" in body) out[Team.TRADITIONAL_TEAM] = editorIdFromBody(body.traditionalEditorId);
  if ("albumEditorId" in body) out[Team.ALBUM_TEAM] = editorIdFromBody(body.albumEditorId);
  return out;
}

function hasEditorAssignmentFields(body: {
  photoEditorId?: string;
  cinematicEditorId?: string;
  traditionalEditorId?: string;
  albumEditorId?: string;
}): boolean {
  return !!(
    body.photoEditorId?.trim() ||
    body.cinematicEditorId?.trim() ||
    body.traditionalEditorId?.trim() ||
    body.albumEditorId?.trim()
  );
}

function shootDayKey(day: Date, override?: string) {
  if (override) return override;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
}

async function buildAssignmentSummary(assigneeIds: Iterable<string>) {
  const ids = [...new Set(assigneeIds)];
  if (ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true },
  });

  const counts = await prisma.task.groupBy({
    by: ["assignedToId"],
    where: { assignedToId: { in: ids } },
    _count: { id: true },
  });
  const countByUser = new Map(counts.map((c) => [c.assignedToId!, c._count.id]));

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    taskCount: countByUser.get(u.id) ?? 0,
  }));
}

/** Editors get notified only via task assignment — not on shoot calendar saves. */
function pulseAfterCalendarSave(assigneeIds: Iterable<string>) {
  emitTaskRefreshToOps();
  const ids = [...new Set(assigneeIds)];
  if (ids.length > 0) pulseAssigneesImmediate(ids);
}

productionCalendarRouter.use(requireAuth);

productionCalendarRouter.get("/entries", requireCoordinatorOrAdmin, async (req, res, next) => {
  try {
    const q = z
      .object({
        from: isoDay,
        to: isoDay,
        summary: z.enum(["1", "0"]).optional(),
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
      include: q.summary === "1" ? entryDashboardInclude : entryInclude,
    });

    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

productionCalendarRouter.get("/entries/assigned", async (req, res, next) => {
  try {
    const auth = req.auth!;
    if (auth.role !== Role.EDITOR) throw new HttpError(403, "Forbidden", "FORBIDDEN");

    const q = z
      .object({
        from: isoDay,
        to: isoDay,
      })
      .parse(req.query);

    const from = parseDayUtc(q.from);
    const to = parseDayUtc(q.to);
    if (to.getTime() < from.getTime()) throw new HttpError(400, "Invalid range", "BAD_REQUEST");

    const editorInclude = {
      createdBy: { select: { id: true, name: true, email: true } },
      event: {
        include: {
          tasks: {
            where: { assignedToId: auth.userId },
            orderBy: [{ deadline: "asc" as const }],
            include: {
              assignedTo: { select: { id: true, name: true, email: true, team: true } },
            },
          },
        },
      },
    } satisfies Prisma.ShootCalendarEntryInclude;

    const entries = await prisma.shootCalendarEntry.findMany({
      where: {
        day: { gte: from, lte: to },
        event: {
          tasks: {
            some: { assignedToId: auth.userId },
          },
        },
      },
      orderBy: [{ day: "asc" }, { createdAt: "asc" }],
      include: editorInclude,
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
  clientContact: z.string().max(200).optional().default(""),
  city: z.string().max(200).optional().default(""),
  eventName: z.string().max(300).optional().default(""),
  venue: z.string().max(500).optional().default(""),
  startTime: z.string().max(50).optional().default(""),
  endTime: z.string().max(50).optional().default(""),
  muhuruthamTime: z.string().max(50).optional().default(""),
  photoTeam: z.string().max(4000).optional().default(""),
  videoTeam: z.string().max(4000).optional().default(""),
  addons: z.string().max(8000).optional().default(""),
  createDeliverableTimeline: z.boolean().optional().default(false),
  photoEditorId: z.string().optional(),
  cinematicEditorId: z.string().optional(),
  traditionalEditorId: z.string().optional(),
  albumEditorId: z.string().optional(),
});

productionCalendarRouter.post("/entries", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = baseFields.parse(req.body);
    const auth = req.auth!;
    const assignments = assignmentsFromBody(body);
    const assigneeIds = new Set<string>();

    const entry = await prisma.$transaction(async (tx) => {
      let eventId: string | null = null;
      let clientName = body.clientName;

      const shouldActivateDeliverables =
        body.createDeliverableTimeline || hasEditorAssignmentFields(body);

      if (shouldActivateDeliverables) {
        const eventDate = parseDayUtc(body.day);
        const ev = await tx.event.create({
          data: {
            clientName: body.clientName,
            eventDate,
            venue: body.venue ?? "",
            shootTime: `${body.startTime ?? ""}–${body.endTime ?? ""}`,
            notes: body.addons ?? "",
            postProductionStarted: true,
            createdById: auth.userId,
          },
        });
        eventId = ev.id;
        clientName = ev.clientName;

        const tasks = await createEventTasksTx(tx, {
          eventId: ev.id,
          eventDate: ev.eventDate,
          createdById: auth.userId,
          assignments,
        });

        await notifyAllAssignedTasksTx(tx, tasks, clientName);
        for (const t of tasks) if (t.assignedToId) assigneeIds.add(t.assignedToId);
      }

      const created = await tx.shootCalendarEntry.create({
        data: {
          day: parseDayUtc(body.day),
          clientName: body.clientName,
          clientType: body.clientType ?? "",
          clientContact: body.clientContact ?? "",
          city: body.city ?? "",
          eventName: body.eventName ?? "",
          venue: body.venue ?? "",
          startTime: body.startTime ?? "",
          endTime: body.endTime ?? "",
          muhuruthamTime: body.muhuruthamTime ?? "",
          photoTeam: body.photoTeam ?? "",
          videoTeam: body.videoTeam ?? "",
          addons: body.addons ?? "",
          createdById: auth.userId,
          eventId,
        },
        include: entryInclude,
      });

      return created;
    });

    pulseAfterCalendarSave(assigneeIds);

    res.status(201).json({
      entry,
      assignedEditorIds: [...assigneeIds],
      assignedEditors: await buildAssignmentSummary(assigneeIds),
    });
  } catch (e) {
    next(e);
  }
});

const patchSchema = baseFields.partial().extend({
  createDeliverableTimeline: z.boolean().optional(),
  syncEditorAssignments: z.boolean().optional(),
});

productionCalendarRouter.put("/entries/:id", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = patchSchema.parse(req.body);
    const auth = req.auth!;
    const explicitAssignments = explicitAssignmentsFromBody(body);
    const assigneeIds = new Set<string>();

    const existing = await prisma.shootCalendarEntry.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Entry not found", "NOT_FOUND");

    const entry = await prisma.$transaction(async (tx) => {
      let eventId = existing.eventId;

      const shouldActivateDeliverables =
        !eventId && (body.createDeliverableTimeline === true || hasEditorAssignmentFields(body));

      if (shouldActivateDeliverables) {
        const dayStr = shootDayKey(existing.day, body.day);
        const clientName = body.clientName ?? existing.clientName;
        const venue = body.venue ?? existing.venue;
        const startTime = body.startTime ?? existing.startTime;
        const endTime = body.endTime ?? existing.endTime;
        const addons = body.addons ?? existing.addons;
        const eventDate = parseDayUtc(dayStr);
        const ev = await tx.event.create({
          data: {
            clientName,
            eventDate,
            venue,
            shootTime: `${startTime}–${endTime}`,
            notes: addons,
            postProductionStarted: true,
            createdById: auth.userId,
          },
        });
        eventId = ev.id;

        const tasks = await createEventTasksTx(tx, {
          eventId: ev.id,
          eventDate: ev.eventDate,
          createdById: auth.userId,
          assignments: assignmentsFromBody(body),
        });

        await notifyAllAssignedTasksTx(tx, tasks, ev.clientName);
        for (const t of tasks) if (t.assignedToId) assigneeIds.add(t.assignedToId);
      } else if (eventId && (body.syncEditorAssignments === true || hasEditorAssignmentFields(body))) {
        const clientName = body.clientName ?? existing.clientName;
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) throw new HttpError(404, "Linked event not found", "NOT_FOUND");
        const { assigneeIds: synced } = await syncEventAssignmentsTx(tx, {
          eventId,
          eventDate: event.eventDate,
          clientName,
          assignments: explicitAssignments,
          assignedById: auth.userId,
          forceNotify: true,
          onlyListedTeams: true,
        });
        for (const uid of synced) assigneeIds.add(uid);
      }

      const nextDay = body.day ? parseDayUtc(body.day) : undefined;

      if (eventId && body.clientName !== undefined) {
        await tx.event.update({
          where: { id: eventId },
          data: { clientName: body.clientName },
        });
      }

      if (eventId && body.venue !== undefined) {
        await tx.event.update({
          where: { id: eventId },
          data: { venue: body.venue },
        });
      }

      return tx.shootCalendarEntry.update({
        where: { id },
        data: {
          ...(nextDay ? { day: nextDay } : {}),
          ...(body.clientName !== undefined ? { clientName: body.clientName } : {}),
          ...(body.clientType !== undefined ? { clientType: body.clientType } : {}),
          ...(body.clientContact !== undefined ? { clientContact: body.clientContact } : {}),
          ...(body.city !== undefined ? { city: body.city } : {}),
          ...(body.eventName !== undefined ? { eventName: body.eventName } : {}),
          ...(body.venue !== undefined ? { venue: body.venue } : {}),
          ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
          ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
          ...(body.muhuruthamTime !== undefined ? { muhuruthamTime: body.muhuruthamTime } : {}),
          ...(body.photoTeam !== undefined ? { photoTeam: body.photoTeam } : {}),
          ...(body.videoTeam !== undefined ? { videoTeam: body.videoTeam } : {}),
          ...(body.addons !== undefined ? { addons: body.addons } : {}),
          ...(eventId !== existing.eventId ? { eventId } : {}),
        },
        include: entryInclude,
      });
    });

    pulseAfterCalendarSave(assigneeIds);

    res.json({
      entry,
      assignedEditorIds: [...assigneeIds],
      assignedEditors: await buildAssignmentSummary(assigneeIds),
    });
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

    emitTaskRefreshToOps();

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const startPostProductionBody = z.object({
  photoEditorId: z.string().optional(),
  cinematicEditorId: z.string().optional(),
  traditionalEditorId: z.string().optional(),
  albumEditorId: z.string().optional(),
  photoEditorIds: z.array(z.string().min(1)).optional(),
  cinematicEditorIds: z.array(z.string().min(1)).optional(),
  traditionalEditorIds: z.array(z.string().min(1)).optional(),
  albumEditorIds: z.array(z.string().min(1)).optional(),
});

productionCalendarRouter.post(
  "/entries/:id/start-post-production",
  requireCoordinatorOrAdmin,
  async (req, res, next) => {
    try {
      const id = z.string().min(1).parse(req.params.id);
      const body = startPostProductionBody.parse(req.body ?? {});
      const auth = req.auth!;
      const assignments = assignmentsFromBody(body);
      const photoIds = body.photoEditorIds ?? (body.photoEditorId ? [body.photoEditorId] : []);
      const cinematicIds = body.cinematicEditorIds ?? (body.cinematicEditorId ? [body.cinematicEditorId] : []);
      const traditionalIds = body.traditionalEditorIds ?? (body.traditionalEditorId ? [body.traditionalEditorId] : []);
      const albumIds = body.albumEditorIds ?? (body.albumEditorId ? [body.albumEditorId] : []);

      const taskAssignees = {
        [TaskType.SNEAK_PEEK_PHOTOS]: photoIds[0] ?? null,
        [TaskType.FULL_SET_PHOTOS]: photoIds[1] ?? photoIds[0] ?? null,
        [TaskType.CINEMATIC_VIDEO]: cinematicIds[0] ?? null,
        [TaskType.REELS]: cinematicIds[1] ?? cinematicIds[0] ?? null,
        [TaskType.TRADITIONAL_VIDEO]: traditionalIds[0] ?? null,
        [TaskType.ALBUM_DESIGN]: albumIds[0] ?? null,
        [TaskType.ALBUM_PRINT]: albumIds[1] ?? albumIds[0] ?? null,
      } satisfies Partial<Record<TaskType, string | null>>;
      const assigneeIds = new Set<string>();

      const existing = await prisma.shootCalendarEntry.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, "Entry not found", "NOT_FOUND");
      if (existing.eventId) throw new HttpError(400, "Post-production already started for this shoot", "BAD_REQUEST");

      const entry = await prisma.$transaction(async (tx) => {
        const eventDate = existing.day;
        const ev = await tx.event.create({
          data: {
            clientName: existing.clientName,
            eventDate,
            venue: existing.venue,
            shootTime: `${existing.startTime}–${existing.endTime}`,
            notes: existing.addons,
            postProductionStarted: true,
            createdById: auth.userId,
          },
        });

        const tasks = await createEventTasksTx(tx, {
          eventId: ev.id,
          eventDate: ev.eventDate,
          createdById: auth.userId,
          assignments,
          taskAssignees,
        });

        await notifyAllAssignedTasksTx(tx, tasks, ev.clientName);
        for (const t of tasks) if (t.assignedToId) assigneeIds.add(t.assignedToId);

        return tx.shootCalendarEntry.update({
          where: { id },
          data: { eventId: ev.id },
          include: entryInclude,
        });
      });

      pulseAfterCalendarSave(assigneeIds);

      res.status(201).json({ entry });
    } catch (e) {
      next(e);
    }
  },
);

productionCalendarRouter.get("/team-members", requireCoordinatorOrAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: Role.EDITOR, isActive: true },
      select: { id: true, name: true, email: true, team: true, designation: true },
      orderBy: [{ team: "asc" }, { name: "asc" }],
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});
