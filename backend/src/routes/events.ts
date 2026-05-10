import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { buildEventTasks } from "../services/eventTasks";
import { emitTaskRefreshToOps } from "../realtime/socket";

export const eventsRouter = Router();

eventsRouter.use(requireAuth, requireRole(Role.ADMIN));

const taskInclude = {
  assignedTo: { select: { id: true, name: true, email: true, team: true } },
} satisfies Prisma.TaskInclude;

const createEventSchema = z.object({
  clientName: z.string().min(1),
  eventDate: z.coerce.date(),
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

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          clientName: body.clientName,
          eventDate: body.eventDate,
          createdById: auth.userId,
          postProductionStarted: true,
        },
      });

      const rows = buildEventTasks(created.id, created.eventDate);
      for (const row of rows) {
        await tx.task.create({ data: row });
      }

      return created;
    });

    emitTaskRefreshToOps();

    const full = await prisma.event.findUnique({
      where: { id: event.id },
      include: { tasks: { include: taskInclude } },
    });

    res.status(201).json({ event: full });
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
