import type { Prisma } from "@prisma/client";
import { Role, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";

export async function resolveTaskAssigneeTx(
  tx: Prisma.TransactionClient,
  assigneeId: string | null | undefined,
  team: Team,
): Promise<string | null> {
  if (!assigneeId) return null;
  const u = await tx.user.findFirst({
    where: { id: assigneeId, isActive: true, role: Role.EDITOR, team },
    select: { id: true },
  });
  if (!u) {
    throw new HttpError(400, `Assignee must be an active editor on ${team}`, "BAD_ASSIGNMENT");
  }
  return u.id;
}
