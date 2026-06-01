import { TaskPriority, TaskStatus } from "@prisma/client";

export function computePriority(deadline: Date, now = new Date()): TaskPriority {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);

  if (diffDays < 0) return TaskPriority.CRITICAL; // overdue
  if (diffDays <= 1) return TaskPriority.CRITICAL;
  if (diffDays <= 3) return TaskPriority.HIGH;
  if (diffDays <= 7) return TaskPriority.MEDIUM;
  return TaskPriority.LOW;
}

export function computeDelayedStatus(current: TaskStatus, deadline: Date, now = new Date()): TaskStatus {
  if (current === TaskStatus.COMPLETED) return current;
  // Active work stays in progress even when past deadline (overdue ≠ stuck on Start).
  if (current === TaskStatus.IN_PROGRESS) return TaskStatus.IN_PROGRESS;
  const overdue = deadline.getTime() < now.getTime();
  if (overdue) return TaskStatus.DELAYED;
  if (current === TaskStatus.DELAYED) return TaskStatus.PENDING;
  return current;
}

