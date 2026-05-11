import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { Team } from "@prisma/client";
import { createEventTasksTx, type EventTaskAssignments } from "../services/eventTasks";
import { emitNotificationRefresh, emitTaskRefreshToOps, emitToUser } from "../realtime/socket";

export const eventsRouter = Router();

eventsRouter.use(requireAuth, requireRole(Role.ADMIN));

const taskInclude = {
  assignedTo: { select: { id: true, name: true, email: true, team: true } },
} satisfies Prisma.TaskInclude;

const createEventSchema = z.object({
  clientName: z.string().min(1),
  eventDate: z.coerce.date(),
  /** Optional editor assignments — tasks will be generated + assigned immediately. */
  photoEditorId: z.string().min(1).optional(),
  cinematicEditorId: z.string().min(1).optional(),
  traditionalEditorId: z.string().min(1).optional(),
  albumEditorId: z.string().min(1).optional(),
});

eventsRouter.get("/", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { tasks: { include: taskInclude } },
  });
  res.json({ events });
});

eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = createEventSchema.parse(req.body);
    const auth = req.auth!;

    const assignments: EventTaskAssignments = {
      [Team.PHOTO_TEAM]: body.photoEditorId ?? null,
      [Team.CINEMATIC_TEAM]: body.cinematicEditorId ?? null,
      [Team.TRADITIONAL_TEAM]: body.traditionalEditorId ?? null,
      [Team.ALBUM_TEAM]: body.albumEditorId ?? null,
    };

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          clientName: body.clientName,
          eventDate: body.eventDate,
          createdById: auth.userId,
          postProductionStarted: true,
        },
      });

      const tasks = await createEventTasksTx(tx, {
        eventId: created.id,
        eventDate: created.eventDate,
        createdById: auth.userId,
        assignments,
      });

      // Notify assigned editors immediately.
      for (const t of tasks) {
        if (!t.assignedToId) continue;
        const due = t.deadline.toISOString().slice(0, 10);
        const taskLabel = String(t.taskType).replaceAll("_", " ");
        await tx.userNotification.create({
          data: {
            userId: t.assignedToId,
            taskId: t.id,
            title: "New wedding assigned",
            body: `${created.clientName} — ${taskLabel}. Deadline: ${due}.`,
          },
        });
      }

      return created;
    });

    emitTaskRefreshToOps();
    const fullAfter = await prisma.event.findUnique({
      where: { id: event.id },
      include: { tasks: { include: taskInclude } },
    });
    const recipients = new Set<string>();
    for (const t of fullAfter?.tasks ?? []) if (t.assignedToId) recipients.add(t.assignedToId);
    for (const userId of recipients) {
      emitNotificationRefresh(userId);
      emitToUser(userId, "task:updated");
    }

    res.status(201).json({ event: fullAfter });
  } catch (e) {
    next(e);
  }
});

const updateEventSchema = z.object({
  clientName: z.string().min(1).optional(),
  eventDate: z.coerce.date().optional(),
});

eventsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = updateEventSchema.parse(req.body);
    const event = await prisma.event.update({
      where: { id },
      data: body,
      include: { tasks: { include: taskInclude } },
    });
    res.json({ event });
  } catch (e) {
    next(e);
  }
});

eventsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await prisma.event.delete({ where: { id } });
    emitTaskRefreshToOps();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
