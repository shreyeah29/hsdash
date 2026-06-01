import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { prisma } from "../prisma/client";
import { emitNotificationRefresh, emitTaskRefreshToOps, emitToUser } from "../realtime/socket";

type Tx = Prisma.TransactionClient;

/** Active editors + operations coordinator (not admin). */
export async function activeCrewUserIds(tx?: Tx): Promise<string[]> {
  const client = tx ?? prisma;
  const users = await client.user.findMany({
    where: { isActive: true, role: { in: [Role.EDITOR, Role.COORDINATOR] } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/**
 * @deprecated Shoot calendar saves no longer broadcast to all crew.
 * Editors are notified only when a deliverable task is assigned to them.
 */
export async function notifyAllCrewNewShoot(
  _tx: Tx,
  _args: {
    clientName: string;
    dayIso: string;
    venue?: string;
    eventName?: string;
    hasDeliverables: boolean;
    taskId?: string | null;
  },
): Promise<string[]> {
  return [];
}

/** @deprecated Use assignment-only pulses (`pulseAssigneesImmediate`). */
export function emitInstantCrewPulse(userIds: Iterable<string>) {
  emitTaskRefreshToOps();
  const seen = new Set<string>();
  for (const userId of userIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    emitNotificationRefresh(userId);
    emitToUser(userId, "notification:new");
    emitToUser(userId, "task:updated");
  }
}
