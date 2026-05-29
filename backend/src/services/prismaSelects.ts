/** Shared Prisma selects to keep list endpoints small and fast. */
export const eventSummarySelect = {
  id: true,
  clientName: true,
  eventDate: true,
} as const;

export const assigneeSummarySelect = {
  id: true,
  name: true,
  email: true,
  team: true,
} as const;

export const taskListInclude = {
  event: { select: eventSummarySelect },
  assignedTo: { select: assigneeSummarySelect },
  assignedBy: { select: { id: true, name: true, email: true } },
} as const;

export const calendarTaskProgressSelect = {
  id: true,
  status: true,
  deadline: true,
} as const;
