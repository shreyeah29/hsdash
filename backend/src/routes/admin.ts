import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { parseDayUtc } from "../utils/calendarDay";
import { getSocketIo } from "../realtime/socket";
import { taskListInclude, calendarTaskProgressSelect } from "../services/prismaSelects";
import {
  computeTaskDashboardStats,
  localDayKey,
  upcomingShootRangeKeys,
  utcStoredDayKey,
} from "../services/dashboardStats";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

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

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const { from, to } = upcomingShootRangeKeys();
    const fromDay = parseDayUtc(from);
    const toDay = parseDayUtc(to);
    const todayKey = localDayKey(new Date());

    const [eventCount, shootCount, tasks, entries] = await Promise.all([
      prisma.event.count(),
      prisma.shootCalendarEntry.count(),
      prisma.task.findMany({
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        include: taskListInclude,
      }),
      prisma.shootCalendarEntry.findMany({
        where: { day: { gte: fromDay, lte: toDay } },
        orderBy: [{ day: "asc" }, { createdAt: "asc" }],
        include: entryDashboardInclude,
      }),
    ]);

    const taskStats = computeTaskDashboardStats(tasks);
    const weddings = eventCount > 0 ? eventCount : shootCount;
    const upcomingEntries = entries.filter((e) => utcStoredDayKey(e.day) >= todayKey);

    res.json({
      stats: {
        ...taskStats,
        weddings,
        eventCount,
        shootCount,
      },
      tasks,
      entries: upcomingEntries,
    });
  } catch (e) {
    next(e);
  }
});

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

const clearProductionSchema = z.object({
  confirm: z.literal("DELETE_ALL_SHOOTS"),
});

/** Wipe all shoot calendar rows, linked events, tasks, and related notifications (keeps users). */
adminRouter.post("/clear-production-data", async (req, res, next) => {
  try {
    clearProductionSchema.parse(req.body);

    const deleted = await prisma.$transaction(async (tx) => {
      const notifications = await tx.userNotification.deleteMany();
      const activities = await tx.taskActivity.deleteMany();
      const tasks = await tx.task.deleteMany();
      const entries = await tx.shootCalendarEntry.deleteMany();
      const events = await tx.event.deleteMany();
      return {
        notifications: notifications.count,
        activities: activities.count,
        tasks: tasks.count,
        entries: entries.count,
        events: events.count,
      };
    });

    getSocketIo()?.emit("task:updated");
    getSocketIo()?.emit("production:cleared");

    res.json({ ok: true, deleted });
  } catch (e) {
    next(e);
  }
});
