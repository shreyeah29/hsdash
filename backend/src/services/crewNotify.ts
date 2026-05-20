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

export async function notifyAllCrewNewShoot(
  tx: Tx,
  args: {
    clientName: string;
    dayIso: string;
    venue?: string;
    eventName?: string;
    hasDeliverables: boolean;
    taskId?: string | null;
  },
): Promise<string[]> {
  const crewIds = await activeCrewUserIds(tx);
  const venueBit = args.venue?.trim() ? ` · ${args.venue.trim()}` : "";
  const eventBit = args.eventName?.trim() ? ` (${args.eventName.trim()})` : "";
  const pipelineBit = args.hasDeliverables
    ? " Deliverable deadlines are live — check your tasks when assigned."
    : " Post-production timeline not started yet.";

  const body = `${args.clientName}${eventBit} on ${args.dayIso}${venueBit}.${pipelineBit}`;

  for (const userId of crewIds) {
    await tx.userNotification.create({
      data: {
        userId,
        taskId: args.taskId ?? null,
        title: "New shoot on the calendar",
        body,
      },
    });
  }

  return crewIds;
}

/** Push socket + notification refresh to crew (and ops rooms). */
export function emitInstantCrewPulse(userIds: Iterable<string>) {
  emitTaskRefreshToOps();
  const seen = new Set<string>();
  for (const userId of userIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    emitNotificationRefresh(userId);
    emitToUser(userId, "notification:new");
    emitToUser(userId, "task:updated");
    emitToUser(userId, "shoot:created");
  }
}
