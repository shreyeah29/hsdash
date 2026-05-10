import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth } from "../middleware/auth";
import { requireCoordinator } from "../middleware/coordinator";
import { Role, TaskPriority, TaskStatus, Team } from "@prisma/client";
import { resolveTaskAssigneeTx } from "../services/taskAssignee";
import { computeDelayedStatus, computePriority } from "../services/taskPriority";
import { recordTaskStatusChange } from "../services/taskActivity";
import { HttpError } from "../utils/httpError";
import { emitNotificationRefresh, emitTaskRefreshToOps, emitToUser } from "../realtime/socket";

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
    const opsView = auth.role === Role.ADMIN || auth.role === Role.COORDINATOR;

    const where: Record<string, unknown> = {};
    if (q.eventId) where.eventId = q.eventId;

    if (opsView) {
      if (q.team) where.assignedTeam = q.team;
      if (q.status) where.status = q.status;
      if (q.priority) where.priority = q.priority;
    } else if (auth.role === Role.EDITOR) {
      where.assignedToId = auth.userId;
    } else {
      throw new HttpError(403, "Forbidden", "FORBIDDEN");
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
      include: {
        event: true,
        assignedTo: { select: { id: true, name: true, email: true, team: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
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

    if (auth.role === Role.ADMIN) {
      throw new HttpError(403, "Admins monitor deliverables; editors and the coordinator update status", "FORBIDDEN");
    }

    const coordinatorActing = auth.role === Role.COORDINATOR;
    if (!coordinatorActing) {
      if (auth.role !== Role.EDITOR || task.assignedToId !== auth.userId) {
        throw new HttpError(403, "Forbidden", "FORBIDDEN");
      }
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
      include: {
        event: true,
        assignedTo: { select: { id: true, name: true, email: true, team: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (updated.status !== previousStatus) {
      await recordTaskStatusChange(id, auth.userId, previousStatus, updated.status);
    }

    emitTaskRefreshToOps();
    if (updated.assignedToId) emitToUser(updated.assignedToId, "task:updated");

    res.json({ task: updated });
  } catch (e) {
    next(e);
  }
});

const assigneeBodySchema = z.object({
  assignedToId: z.union([z.string().min(1), z.null()]),
});

tasksRouter.put("/:id/assignee", requireCoordinator, async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = assigneeBodySchema.parse(req.body);
    const auth = req.auth!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!task) throw new HttpError(404, "Task not found", "NOT_FOUND");

    const previousAssigneeId = task.assignedToId;

    const updated = await prisma.$transaction(async (tx) => {
      const assignedToId = await resolveTaskAssigneeTx(tx, body.assignedToId, task.assignedTeam);
      return tx.task.update({
        where: { id },
        data: { assignedToId, assignedById: assignedToId ? auth.userId : null },
        include: {
          event: true,
          assignedTo: { select: { id: true, name: true, email: true, team: true } },
          assignedBy: { select: { id: true, name: true, email: true } },
        },
      });
    });

    if (updated.assignedToId && updated.assignedToId !== previousAssigneeId) {
      const clientName = updated.event?.clientName ?? "Job";
      const due = updated.deadline.toISOString().slice(0, 10);
      const taskLabel = String(updated.taskType).replaceAll("_", " ");
      await prisma.userNotification.create({
        data: {
          userId: updated.assignedToId,
          taskId: updated.id,
          title: "New task assignment",
          body: `${taskLabel} — ${clientName}. Deadline: ${due}.`,
        },
      });
      emitNotificationRefresh(updated.assignedToId);
      emitToUser(updated.assignedToId, "task:updated");
    }

    emitTaskRefreshToOps();

    res.json({ task: updated });
  } catch (e) {
    next(e);
  }
});
