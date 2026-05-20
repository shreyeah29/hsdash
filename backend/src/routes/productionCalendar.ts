import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { Role, Team } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireCoordinator, requireCoordinatorOrAdmin } from "../middleware/coordinator";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";
import { createEventTasksTx, type EventTaskAssignments } from "../services/eventTasks";
import { resolveTaskAssigneeTx } from "../services/taskAssignee";
import { emitNotificationRefresh, emitTaskRefreshToOps, emitToUser } from "../realtime/socket";

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

function assignmentsFromBody(body: {
  photoEditorId?: string;
  cinematicEditorId?: string;
  traditionalEditorId?: string;
  albumEditorId?: string;
}): EventTaskAssignments {
  return {
    [Team.PHOTO_TEAM]: body.photoEditorId?.trim() || null,
    [Team.CINEMATIC_TEAM]: body.cinematicEditorId?.trim() || null,
    [Team.TRADITIONAL_TEAM]: body.traditionalEditorId?.trim() || null,
    [Team.ALBUM_TEAM]: body.albumEditorId?.trim() || null,
  };
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

async function notifyNewAssignments(
  tx: Prisma.TransactionClient,
  tasks: Array<{
    id: string;
    assignedToId: string | null;
    taskType: string;
    deadline: Date;
    assignedTeam: Team;
  }>,
  clientName: string,
  onlyUserIds?: Set<string>,
) {
  for (const t of tasks) {
    if (!t.assignedToId) continue;
    if (onlyUserIds && !onlyUserIds.has(t.assignedToId)) continue;
    const due = t.deadline.toISOString().slice(0, 10);
    const taskLabel = String(t.taskType).replaceAll("_", " ");
    await tx.userNotification.create({
      data: {
        userId: t.assignedToId,
        taskId: t.id,
        title: "New wedding assigned",
        body: `${clientName} — ${taskLabel}. Deadline: ${due}.`,
      },
    });
  }
}

async function applyAssignmentsToExistingEvent(
  tx: import("@prisma/client").Prisma.TransactionClient,
  eventId: string,
  clientName: string,
  assignments: EventTaskAssignments,
  assignedById: string,
) {
  const tasks = await tx.task.findMany({ where: { eventId } });
  const newlyAssignedUserIds = new Set<string>();

  for (const task of tasks) {
    const nextAssignee = await resolveTaskAssigneeTx(tx, assignments[task.assignedTeam], task.assignedTeam);
    if (!nextAssignee || nextAssignee === task.assignedToId) continue;

    await tx.task.update({
      where: { id: task.id },
      data: { assignedToId: nextAssignee, assignedById: assignedById },
    });

    newlyAssignedUserIds.add(nextAssignee);
    const due = task.deadline.toISOString().slice(0, 10);
    const taskLabel = String(task.taskType).replaceAll("_", " ");
    await tx.userNotification.create({
      data: {
        userId: nextAssignee,
        taskId: task.id,
        title: "New wedding assigned",
        body: `${clientName} — ${taskLabel}. Deadline: ${due}.`,
      },
    });
  }

  return { tasks, newlyAssignedUserIds };
}

function emitRefreshForEditors(userIds: Iterable<string>) {
  emitTaskRefreshToOps();
  for (const userId of userIds) {
    emitNotificationRefresh(userId);
    emitToUser(userId, "task:updated");
  }
}

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
  eventName: z.string().max(300).optional().default(""),
  venue: z.string().max(500).optional().default(""),
  startTime: z.string().max(50).optional().default(""),
  endTime: z.string().max(50).optional().default(""),
  photoTeam: z.string().max(4000).optional().default(""),
  videoTeam: z.string().max(4000).optional().default(""),
  addons: z.string().max(8000).optional().default(""),
  createDeliverableTimeline: z.boolean().optional().default(false),
  photoEditorId: z.string().min(1).optional(),
  cinematicEditorId: z.string().min(1).optional(),
  traditionalEditorId: z.string().min(1).optional(),
  albumEditorId: z.string().min(1).optional(),
});

productionCalendarRouter.post("/entries", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = baseFields.parse(req.body);
    const auth = req.auth!;
    const assignments = assignmentsFromBody(body);
    const notifyUserIds = new Set<string>();

    const entry = await prisma.$transaction(async (tx) => {
      let eventId: string | null = null;
      let clientName = body.clientName;

      if (body.createDeliverableTimeline) {
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

        await notifyNewAssignments(tx, tasks, clientName);
        for (const t of tasks) if (t.assignedToId) notifyUserIds.add(t.assignedToId);
      }

      return tx.shootCalendarEntry.create({
        data: {
          day: parseDayUtc(body.day),
          clientName: body.clientName,
          clientType: body.clientType ?? "",
          eventName: body.eventName ?? "",
          venue: body.venue ?? "",
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

    if (body.createDeliverableTimeline) emitRefreshForEditors(notifyUserIds);

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
    const auth = req.auth!;
    const assignments = assignmentsFromBody(body);
    const notifyUserIds = new Set<string>();

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
          assignments,
        });

        await notifyNewAssignments(tx, tasks, ev.clientName);
        for (const t of tasks) if (t.assignedToId) notifyUserIds.add(t.assignedToId);
      } else if (eventId && hasEditorAssignmentFields(body)) {
        const clientName = body.clientName ?? existing.clientName;
        const { newlyAssignedUserIds } = await applyAssignmentsToExistingEvent(
          tx,
          eventId,
          clientName,
          assignments,
          auth.userId,
        );
        for (const uid of newlyAssignedUserIds) notifyUserIds.add(uid);
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
          ...(body.eventName !== undefined ? { eventName: body.eventName } : {}),
          ...(body.venue !== undefined ? { venue: body.venue } : {}),
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

    if (notifyUserIds.size > 0 || body.createDeliverableTimeline) emitRefreshForEditors(notifyUserIds);

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

    emitTaskRefreshToOps();

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const startPostProductionBody = z.object({
  photoEditorId: z.string().min(1).optional(),
  cinematicEditorId: z.string().min(1).optional(),
  traditionalEditorId: z.string().min(1).optional(),
  albumEditorId: z.string().min(1).optional(),
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
      const notifyUserIds = new Set<string>();

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
        });

        await notifyNewAssignments(tx, tasks, ev.clientName);
        for (const t of tasks) if (t.assignedToId) notifyUserIds.add(t.assignedToId);

        return tx.shootCalendarEntry.update({
          where: { id },
          data: { eventId: ev.id },
          include: entryInclude,
        });
      });

      emitRefreshForEditors(notifyUserIds);

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
