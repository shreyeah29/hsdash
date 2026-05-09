import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Role, Team, TaskPriority, TaskStatus, TaskType } from "@prisma/client";

const prisma = new PrismaClient();

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function main() {
  const defaultPassword = reqEnv("SEED_DEFAULT_PASSWORD");
  const hashed = await bcrypt.hash(defaultPassword, 12);

  await prisma.task.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

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
        role: Role.TEAM_MEMBER,
        team: Team.PHOTO_TEAM,
        designation: "Photo Editor",
        isActive: true,
      },
      {
        name: "Shashi",
        email: "shashi@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
        team: Team.CINEMATIC_TEAM,
        designation: "Cinematic Video Editor",
        isActive: true,
      },
      {
        name: "Asha",
        email: "asha@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
        team: Team.CINEMATIC_TEAM,
        designation: "Cinematic Video Editor",
        isActive: true,
      },
      {
        name: "Anil",
        email: "anil@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
        team: Team.TRADITIONAL_TEAM,
        designation: "Traditional Video Editor",
        isActive: true,
      },
      {
        name: "Emmanuel",
        email: "emmanuel@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
        team: Team.DATA_MANAGEMENT,
        designation: "Data Copy and Management",
        isActive: true,
      },
      {
        name: "Venkatesh",
        email: "venkatesh@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
        team: Team.PHOTO_TEAM,
        designation: "Photo Editor",
        isActive: true,
      },
      {
        name: "Ravindra",
        email: "ravindra@wedding.local",
        password: hashed,
        role: Role.TEAM_MEMBER,
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
    },
  });

  const mkDeadline = (days: number) => {
    const d = new Date(eventDate);
    d.setDate(d.getDate() + days);
    return d;
  };

  await prisma.task.createMany({
    data: [
      {
        eventId: sampleEvent.id,
        taskType: TaskType.PREVIEW_PHOTOS,
        assignedTeam: Team.PHOTO_TEAM,
        deadline: mkDeadline(7),
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
      },
      {
        eventId: sampleEvent.id,
        taskType: TaskType.FULL_PHOTOS,
        assignedTeam: Team.PHOTO_TEAM,
        deadline: mkDeadline(20),
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
      },
      {
        eventId: sampleEvent.id,
        taskType: TaskType.CINEMATIC_VIDEO,
        assignedTeam: Team.CINEMATIC_TEAM,
        deadline: mkDeadline(30),
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
      },
      {
        eventId: sampleEvent.id,
        taskType: TaskType.TRADITIONAL_VIDEO,
        assignedTeam: Team.TRADITIONAL_TEAM,
        deadline: mkDeadline(45),
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
      },
      {
        eventId: sampleEvent.id,
        taskType: TaskType.ALBUM_DESIGN,
        assignedTeam: Team.ALBUM_TEAM,
        deadline: mkDeadline(45),
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

