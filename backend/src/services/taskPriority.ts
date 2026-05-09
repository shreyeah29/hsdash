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
  if (deadline.getTime() < now.getTime()) return TaskStatus.DELAYED;
  if (current === TaskStatus.DELAYED) return TaskStatus.PENDING;
  return current;
}

