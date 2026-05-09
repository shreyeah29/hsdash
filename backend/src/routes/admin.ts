import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

adminRouter.get("/task-activity", async (req, res, next) => {
  try {
    const q = z
      .object({
        limit: z.coerce.number().min(1).max(200).optional().default(80),
      })
      .parse(req.query);

    const rows = await prisma.taskActivity.findMany({
      take: q.limit,
      orderBy: { createdAt: "desc" },
      include: {
        task: { include: { event: true } },
        actor: { select: { id: true, name: true, email: true, team: true } },
      },
    });

    res.json({ activities: rows });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/calendar-notes", async (req, res, next) => {
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

    const notes = await prisma.adminCalendarNote.findMany({
      where: {
        day: { gte: from, lte: to },
      },
      orderBy: { day: "asc" },
    });

    res.json({ notes });
  } catch (e) {
    next(e);
  }
});

const noteBodySchema = z.object({
  day: isoDay,
  title: z.string().max(200).optional(),
  body: z.string().max(8000).default(""),
});

adminRouter.post("/calendar-notes", async (req, res, next) => {
  try {
    const body = noteBodySchema.parse(req.body);
    const note = await prisma.adminCalendarNote.create({
      data: {
        day: parseDayUtc(body.day),
        title: body.title,
        body: body.body,
      },
    });
    res.status(201).json({ note });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/calendar-notes/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await prisma.adminCalendarNote.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
