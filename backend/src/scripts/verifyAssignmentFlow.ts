/**
 * Local smoke test: assign Laxman to photo tasks → verify DB rows.
 * Run: cd backend && npx tsx src/scripts/verifyAssignmentFlow.ts
 */
import "dotenv/config";
import { Team } from "@prisma/client";
import { prisma } from "../prisma/client";
import { createEventTasksTx } from "../services/eventTasks";
import { syncEventAssignmentsTx } from "../services/eventAssignment";

async function main() {
  const laxman = await prisma.user.findUnique({ where: { email: "laxman@wedding.local" } });
  const admin = await prisma.user.findUnique({ where: { email: "admin@wedding.local" } });
  if (!laxman || !admin) {
    console.error("Seed users missing — run npm run seed first");
    process.exit(1);
  }

  const eventDate = new Date();
  eventDate.setUTCDate(eventDate.getUTCDate() + 14);

  const result = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        clientName: "Assignment smoke test",
        eventDate,
        postProductionStarted: true,
        createdById: admin.id,
      },
    });

    await createEventTasksTx(tx, {
      eventId: ev.id,
      eventDate: ev.eventDate,
      createdById: admin.id,
      assignments: {
        [Team.PHOTO_TEAM]: laxman.id,
        [Team.CINEMATIC_TEAM]: null,
        [Team.TRADITIONAL_TEAM]: null,
        [Team.ALBUM_TEAM]: null,
      },
    });

    const { assigneeIds } = await syncEventAssignmentsTx(tx, {
      eventId: ev.id,
      eventDate: ev.eventDate,
      clientName: ev.clientName,
      assignments: { [Team.PHOTO_TEAM]: laxman.id },
      assignedById: admin.id,
      forceNotify: true,
      onlyListedTeams: true,
    });

    const laxmanTasks = await tx.task.findMany({ where: { assignedToId: laxman.id, eventId: ev.id } });

    await tx.event.delete({ where: { id: ev.id } });

    return { assigneeIds, laxmanTasks };
  });

  console.log("Laxman task count on event:", result.laxmanTasks.length);
  console.log("Assignee ids from sync:", [...result.assigneeIds]);
  if (result.laxmanTasks.length < 2) {
    console.error("FAIL: expected 2 photo tasks for Laxman");
    process.exit(1);
  }
  console.log("OK: assignment flow works in database");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
