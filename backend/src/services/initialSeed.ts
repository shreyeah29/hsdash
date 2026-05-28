import bcrypt from "bcrypt";
import { prisma } from "../prisma/client";
import { Role, Team, TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { DEFAULT_EVENT_TASKS } from "./eventTasks";

/**
 * Seeds admin + coordinator + editors (and optional demo event) when the DB is empty,
 * or wipes and re-seeds when wipeExisting is true (CLI seed).
 */
export async function runInitialSeed(options: { wipeExisting: boolean }) {
  const defaultPassword =
    process.env.SEED_DEFAULT_PASSWORD?.trim() || "ChangeMe123!";
  const hashed = await bcrypt.hash(defaultPassword, 12);

  if (options.wipeExisting) {
    await prisma.userNotification.deleteMany();
    await prisma.taskActivity.deleteMany();
    await prisma.task.deleteMany();
    await prisma.shootCalendarEntry.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  } else {
    const existing = await prisma.user.count();
    if (existing > 0) return;
  }

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: "admin@wedding.local",
        password: hashed,
        role: Role.ADMIN,
        isActive: true,
      },
      {
        name: "Laxman",
        email: "laxman@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.PHOTO_TEAM,
        designation: "Photo Editor",
        isActive: true,
      },
      {
        name: "Shashi",
        email: "shashi@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.CINEMATIC_TEAM,
        designation: "Cinematic Video Editor",
        isActive: true,
      },
      {
        name: "Asha",
        email: "asha@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.CINEMATIC_TEAM,
        designation: "Cinematic Video Editor",
        isActive: true,
      },
      {
        name: "Anil",
        email: "anil@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.TRADITIONAL_TEAM,
        designation: "Traditional Video Editor",
        isActive: true,
      },
      {
        name: "Emmanuel",
        email: "emmanuel@wedding.local",
        password: hashed,
        role: Role.COORDINATOR,
        team: Team.COORDINATOR_TEAM,
        designation: "Data Copy & Management Coordinator",
        isActive: true,
      },
      {
        name: "Venkatesh",
        email: "venkatesh@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.PHOTO_TEAM,
        designation: "Photo Editor",
        isActive: true,
      },
      {
        name: "Ravindra",
        email: "ravindra@wedding.local",
        password: hashed,
        role: Role.EDITOR,
        team: Team.ALBUM_TEAM,
        designation: "Album Designer",
        isActive: true,
      },
    ],
  });

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7);

  const sampleEvent = await prisma.event.create({
    data: {
      clientName: "Rahul & Priya",
      eventDate,
      venue: "",
      shootTime: "",
      notes: "Sample seeded job",
      postProductionStarted: true,
    },
  });

  const mkDeadline = (days: number) => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() + days);
    return d;
  };

  await prisma.task.createMany({
    data: DEFAULT_EVENT_TASKS.map((t) => ({
      eventId: sampleEvent.id,
      taskType: t.taskType,
      assignedTeam: t.assignedTeam,
      deadline: mkDeadline(t.daysAfterEvent),
      status: TaskStatus.PENDING,
      priority:
        t.daysAfterEvent <= 7 ? TaskPriority.MEDIUM : t.daysAfterEvent <= 20 ? TaskPriority.LOW : TaskPriority.LOW,
    })),
  });

  // eslint-disable-next-line no-console
  console.log(
    options.wipeExisting
      ? "[seed] Database re-seeded (wiped existing users/events/tasks)."
      : "[seed] Empty database detected — created default users + sample wedding/event/tasks.",
  );
  // eslint-disable-next-line no-console
  console.log(
    `[seed] Login password for all seeded users: ${defaultPassword} (set SEED_DEFAULT_PASSWORD to override before first boot / prisma seed)`,
  );
}
