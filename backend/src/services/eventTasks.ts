import type { Prisma } from "@prisma/client";
import { Team, TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { computePriority } from "./taskPriority";
import { resolveTaskAssigneeTx } from "./taskAssignee";

export type AutoTaskTemplate = {
  taskType: TaskType;
  assignedTeam: Team;
  daysAfterEvent: number;
};

export const DEFAULT_EVENT_TASKS: AutoTaskTemplate[] = [
  // Ops lane (sheet: DATA COPY)
  { taskType: TaskType.DATA_COPY, assignedTeam: Team.COORDINATOR_TEAM, daysAfterEvent: 1 },
  { taskType: TaskType.SNEAK_PEEK_PHOTOS, assignedTeam: Team.PHOTO_TEAM, daysAfterEvent: 2 },
  { taskType: TaskType.PREVIEW_PHOTOS, assignedTeam: Team.PHOTO_TEAM, daysAfterEvent: 7 },
  { taskType: TaskType.FULL_SET_PHOTOS, assignedTeam: Team.PHOTO_TEAM, daysAfterEvent: 14 },
  { taskType: TaskType.FULL_PHOTOS, assignedTeam: Team.PHOTO_TEAM, daysAfterEvent: 20 },
  { taskType: TaskType.CINEMATIC_HIGHLIGHT, assignedTeam: Team.CINEMATIC_TEAM, daysAfterEvent: 35 },
  { taskType: TaskType.CINEMATIC_VIDEO, assignedTeam: Team.CINEMATIC_TEAM, daysAfterEvent: 30 },
  { taskType: TaskType.ALBUM_DESIGN, assignedTeam: Team.ALBUM_TEAM, daysAfterEvent: 45 },
  { taskType: TaskType.TRADITIONAL_VIDEO, assignedTeam: Team.TRADITIONAL_TEAM, daysAfterEvent: 60 },
  { taskType: TaskType.ALBUM_PRINT, assignedTeam: Team.ALBUM_TEAM, daysAfterEvent: 60 },
];

export function buildEventTasks(eventId: string, eventDate: Date) {
  return DEFAULT_EVENT_TASKS.map((t) => {
    const deadline = new Date(eventDate);
    deadline.setDate(deadline.getDate() + t.daysAfterEvent);
    const priority = computePriority(deadline);

    return {
      eventId,
      taskType: t.taskType,
      assignedTeam: t.assignedTeam,
      deadline,
      status: TaskStatus.PENDING,
      priority: priority ?? TaskPriority.LOW,
    };
  });
}

export type EventTaskAssignments = Partial<Record<Team, string | null>>;

export async function createEventTasksTx(
  tx: Prisma.TransactionClient,
  args: {
    eventId: string;
    eventDate: Date;
    createdById: string | null;
    assignments?: EventTaskAssignments;
    /**
     * Optional per-deliverable assignment. When provided, takes precedence over team-wide `assignments`.
     * Useful when a team has multiple editors and tasks should be split across them.
     */
    taskAssignees?: Partial<Record<TaskType, string | null>>;
  },
) {
  const rows = buildEventTasks(args.eventId, args.eventDate);
  const created = [];

  for (const row of rows) {
    const preferred =
      args.taskAssignees && row.taskType in args.taskAssignees
        ? args.taskAssignees[row.taskType]
        : args.assignments
          ? args.assignments[row.assignedTeam]
          : null;
    const assignedToId = await resolveTaskAssigneeTx(tx, preferred, row.assignedTeam);

    created.push(
      await tx.task.create({
        data: {
          ...row,
          assignedToId,
          assignedById: assignedToId ? args.createdById : null,
        },
        include: {
          event: true,
          assignedTo: { select: { id: true, name: true, email: true, team: true } },
          assignedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    );
  }

  return created;
}

