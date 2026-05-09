import cron from "node-cron";
import { prisma } from "../prisma/client";
import { computeDelayedStatus, computePriority } from "./taskPriority";

export function startCronJobs() {
  // Daily at 00:05
  cron.schedule("5 0 * * *", async () => {
    const now = new Date();
    const tasks = await prisma.task.findMany({
      select: { id: true, deadline: true, status: true },
    });

    const updates = tasks.map((t) => {
      const status = computeDelayedStatus(t.status, t.deadline, now);
      const priority = computePriority(t.deadline, now);
      return prisma.task.update({
        where: { id: t.id },
        data: { status, priority },
      });
    });

    await prisma.$transaction(updates);
  });
}

