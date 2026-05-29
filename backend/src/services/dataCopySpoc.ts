import type { Prisma } from "@prisma/client";
import { Role, TaskType } from "@prisma/client";
import { prisma } from "../prisma/client";

/** Active operations coordinator — default SPOC for every DATA COPY task (Emmanuel). */
export async function findDataCopySpocUserIdTx(tx: Prisma.TransactionClient) {
  const user = await tx.user.findFirst({
    where: { role: Role.COORDINATOR, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function findDataCopySpocUserId() {
  return findDataCopySpocUserIdTx(prisma);
}

/** Backfill any DATA_COPY rows still unassigned (e.g. created before auto-assign). */
export async function ensureDataCopySpocAssignments() {
  const spocId = await findDataCopySpocUserId();
  if (!spocId) return { updated: 0 };

  const result = await prisma.task.updateMany({
    where: {
      taskType: TaskType.DATA_COPY,
      OR: [{ assignedToId: null }, { assignedToId: { not: spocId } }],
    },
    data: { assignedToId: spocId },
  });

  return { updated: result.count };
}

export function isDataCopyTask(taskType: string) {
  return taskType === TaskType.DATA_COPY;
}
