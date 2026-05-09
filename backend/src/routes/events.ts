import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { buildEventTasks } from "../services/eventTasks";

export const eventsRouter = Router();

eventsRouter.use(requireAuth, requireRole(Role.ADMIN));

const createEventSchema = z.object({
  clientName: z.string().min(1),
  eventDate: z.coerce.date(),
});

eventsRouter.get("/", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: { tasks: true },
  });
  res.json({ events });
});

eventsRouter.post("/", async (req, res, next) => {
  try {
    const body = createEventSchema.parse(req.body);

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          clientName: body.clientName,
          eventDate: body.eventDate,
        },
      });

      await tx.task.createMany({
        data: buildEventTasks(created.id, created.eventDate),
      });

      return created;
    });

    const full = await prisma.event.findUnique({
      where: { id: event.id },
      include: { tasks: true },
    });

    res.status(201).json({ event: full });
  } catch (e) {
    next(e);
  }
});

const updateEventSchema = createEventSchema.partial();

eventsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = updateEventSchema.parse(req.body);
    const event = await prisma.event.update({
      where: { id },
      data: body,
      include: { tasks: true },
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
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

