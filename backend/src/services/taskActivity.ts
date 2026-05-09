import { prisma } from "../prisma/client";
import type { TaskStatus } from "@prisma/client";

export async function recordTaskStatusChange(
  taskId: string,
  actorUserId: string | null,
  previousStatus: TaskStatus | null,
  newStatus: TaskStatus,
) {
  await prisma.taskActivity.create({
    data: {
      taskId,
      actorUserId,
      previousStatus,
      newStatus,
    },
  });
}
