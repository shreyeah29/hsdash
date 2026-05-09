import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth } from "../middleware/auth";
import { isProductionCoordinator, requireCoordinatorOrAdmin } from "../middleware/coordinator";
import { Role, TaskPriority, TaskStatus, Team } from "@prisma/client";
import { resolveTaskAssigneeTx } from "../services/taskAssignee";
import { computeDelayedStatus, computePriority } from "../services/taskPriority";
import { recordTaskStatusChange } from "../services/taskActivity";
import { HttpError } from "../utils/httpError";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

const listQuerySchema = z.object({
  team: z.nativeEnum(Team).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  eventId: z.string().optional(),
});

tasksRouter.get("/", async (req, res, next) => {
  try {
    const q = listQuerySchema.parse(req.query);
    const auth = req.auth!;
    const coordinatorView = auth.role === Role.ADMIN || isProductionCoordinator(auth);

    const where: Record<string, unknown> = {};
    if (q.eventId) where.eventId = q.eventId;

    if (coordinatorView) {
      if (q.team) where.assignedTeam = q.team;
      if (q.status) where.status = q.status;
      if (q.priority) where.priority = q.priority;
    } else {
      if (!auth.team) throw new HttpError(403, "Team not assigned", "FORBIDDEN");
      where.assignedTeam = auth.team;
      where.OR = [{ assignedToId: null }, { assignedToId: auth.userId }];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      include: {
        event: true,
        assignedTo: { select: { id: true, name: true, email: true, team: true } },
      },
    });

    res.json({ tasks });
  } catch (e) {
    next(e);
  }
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

tasksRouter.put("/:id/status", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = updateStatusSchema.parse(req.body);
    const auth = req.auth!;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new HttpError(404, "Task not found", "NOT_FOUND");

    const coordinatorView = auth.role === Role.ADMIN || isProductionCoordinator(auth);
    if (!coordinatorView) {
      if (!auth.team || task.assignedTeam !== auth.team) throw new HttpError(403, "Forbidden", "FORBIDDEN");
    }

    const now = new Date();
    const nextStatus = TaskStatus[body.status as keyof typeof TaskStatus];
    const status = computeDelayedStatus(nextStatus, task.deadline, now);
    const priority = computePriority(task.deadline, now);
    const previousStatus = task.status;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        priority,
      },
      include: { event: true, assignedTo: { select: { id: true, name: true, email: true, team: true } } },
    });

    if (updated.status !== previousStatus) {
      await recordTaskStatusChange(id, auth.userId, previousStatus, updated.status);
    }

    res.json({ task: updated });
  } catch (e) {
    next(e);
  }
});

const assigneeBodySchema = z.object({
  assignedToId: z.union([z.string().min(1), z.null()]),
});

tasksRouter.put("/:id/assignee", requireCoordinatorOrAdmin, async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = assigneeBodySchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new HttpError(404, "Task not found", "NOT_FOUND");

    const updated = await prisma.$transaction(async (tx) => {
      const assignedToId = await resolveTaskAssigneeTx(tx, body.assignedToId, task.assignedTeam);
      return tx.task.update({
        where: { id },
        data: { assignedToId },
        include: {
          event: true,
          assignedTo: { select: { id: true, name: true, email: true, team: true } },
        },
      });
    });

    res.json({ task: updated });
  } catch (e) {
    next(e);
  }
});

