import type { Prisma } from "@prisma/client";
import { emitNotificationRefresh, emitTaskRefreshToOps, emitToUser } from "../realtime/socket";

type Tx = Prisma.TransactionClient;

type TaskLike = {
  id: string;
  assignedToId: string | null;
  taskType: string;
  deadline: Date;
};

/** In-app alert: admin assigned this deliverable to you. */
export async function notifyAssignedTaskTx(
  tx: Tx,
  args: {
    userId: string;
    taskId: string;
    clientName: string;
    taskType: string;
    deadline: Date;
  },
) {
  const due = args.deadline.toISOString().slice(0, 10);
  const taskLabel = String(args.taskType).replaceAll("_", " ");
  await tx.userNotification.create({
    data: {
      userId: args.userId,
      taskId: args.taskId,
      title: "You've been assigned",
      body: `${args.clientName} — ${taskLabel}. Deadline: ${due}.`,
    },
  });
}

/** Notify every assignee on these tasks (e.g. right after admin picks editors). */
export async function notifyAllAssignedTasksTx(
  tx: Tx,
  tasks: TaskLike[],
  clientName: string,
) {
  for (const t of tasks) {
    if (!t.assignedToId) continue;
    await notifyAssignedTaskTx(tx, {
      userId: t.assignedToId,
      taskId: t.id,
      clientName,
      taskType: t.taskType,
      deadline: t.deadline,
    });
  }
}

/** Realtime: refresh tasks + notification bell for each assignee immediately. */
export function pulseAssigneesImmediate(userIds: Iterable<string>) {
  emitTaskRefreshToOps();
  const seen = new Set<string>();
  for (const userId of userIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    emitNotificationRefresh(userId);
    emitToUser(userId, "notification:new");
    emitToUser(userId, "task:updated");
    emitToUser(userId, "assignment:updated");
  }
}
