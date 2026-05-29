import type { Prisma } from "@prisma/client";
import { TaskType } from "@prisma/client";
import { createEventTasksTx, type EventTaskAssignments } from "./eventTasks";
import { notifyAllAssignedTasksTx, notifyAssignedTaskTx } from "./assignmentNotify";
import { resolveTaskAssigneeTx } from "./taskAssignee";
import { findDataCopySpocUserIdTx } from "./dataCopySpoc";

type Tx = Prisma.TransactionClient;

/** Apply admin editor picks to every deliverable on an event; create tasks if missing. */
export async function syncEventAssignmentsTx(
  tx: Tx,
  args: {
    eventId: string;
    eventDate: Date;
    clientName: string;
    assignments: EventTaskAssignments;
    assignedById: string;
    forceNotify?: boolean;
    /** When true, only update teams present in `assignments` (partial calendar save). */
    onlyListedTeams?: boolean;
  },
) {
  const assigneeIds = new Set<string>();
  let tasks = await tx.task.findMany({ where: { eventId: args.eventId } });

  if (tasks.length === 0) {
    const created = await createEventTasksTx(tx, {
      eventId: args.eventId,
      eventDate: args.eventDate,
      createdById: args.assignedById,
      assignments: args.assignments,
    });
    await notifyAllAssignedTasksTx(tx, created, args.clientName);
    for (const t of created) if (t.assignedToId) assigneeIds.add(t.assignedToId);
    return { assigneeIds, tasks: created };
  }

  for (const task of tasks) {
    if (task.taskType === TaskType.DATA_COPY) {
      const spocId = await findDataCopySpocUserIdTx(tx);
      if (spocId && task.assignedToId !== spocId) {
        await tx.task.update({
          where: { id: task.id },
          data: { assignedToId: spocId, assignedById: args.assignedById },
        });
        assigneeIds.add(spocId);
      }
      continue;
    }

    if (args.onlyListedTeams && args.assignments[task.assignedTeam] === undefined) {
      continue;
    }

    const editorPick = args.assignments[task.assignedTeam] ?? null;
    const nextAssignee = await resolveTaskAssigneeTx(tx, editorPick, task.assignedTeam);
    const previousAssignee = task.assignedToId;

    if (nextAssignee !== previousAssignee) {
      await tx.task.update({
        where: { id: task.id },
        data: {
          assignedToId: nextAssignee,
          assignedById: nextAssignee ? args.assignedById : null,
        },
      });
      if (previousAssignee) assigneeIds.add(previousAssignee);
    }

    if (nextAssignee) {
      assigneeIds.add(nextAssignee);
      const shouldNotify = args.forceNotify || nextAssignee !== previousAssignee;
      if (shouldNotify) {
        await notifyAssignedTaskTx(tx, {
          userId: nextAssignee,
          taskId: task.id,
          clientName: args.clientName,
          taskType: task.taskType,
          deadline: task.deadline,
        });
      }
    }
  }

  return { assigneeIds, tasks };
}
