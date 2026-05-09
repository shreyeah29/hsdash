export const Role = {
  ADMIN: "ADMIN",
  TEAM_MEMBER: "TEAM_MEMBER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Team = {
  PHOTO_TEAM: "PHOTO_TEAM",
  CINEMATIC_TEAM: "CINEMATIC_TEAM",
  TRADITIONAL_TEAM: "TRADITIONAL_TEAM",
  ALBUM_TEAM: "ALBUM_TEAM",
  DATA_MANAGEMENT: "DATA_MANAGEMENT",
} as const;
export type Team = (typeof Team)[keyof typeof Team];

export const TaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DELAYED: "DELAYED",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: Team | null;
  designation: string | null;
  isActive: boolean;
};

export type Event = {
  id: string;
  clientName: string;
  eventDate: string;
  createdAt: string;
};

export type TaskAssigneeSummary = {
  id: string;
  name: string;
  email: string;
  team: Team | null;
};

export type Task = {
  id: string;
  eventId: string;
  taskType: string;
  assignedTeam: Team;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  assignedToId?: string | null;
  assignedTo?: TaskAssigneeSummary | null;
  event?: Event;
};

export type AdminCalendarNote = {
  id: string;
  day: string;
  title?: string | null;
  body: string;
  createdAt: string;
};

/** Shoot-day logistics row (Emmanuel); optional linked Event powers deliverable tasks. */
export type ShootCalendarEntry = {
  id: string;
  day: string;
  clientName: string;
  clientType: string;
  eventName: string;
  startTime: string;
  endTime: string;
  photoTeam: string;
  videoTeam: string;
  addons: string;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  eventId: string | null;
  event:
    | null
    | (Event & {
        tasks: Task[];
      });
};

