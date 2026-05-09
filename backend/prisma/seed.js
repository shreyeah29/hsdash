"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function reqEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env ${name}`);
    return v;
}
async function main() {
    const defaultPassword = reqEnv("SEED_DEFAULT_PASSWORD");
    const hashed = await bcrypt_1.default.hash(defaultPassword, 12);
    await prisma.task.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.createMany({
        data: [
            {
                name: "Admin User",
                email: "admin@wedding.local",
                password: hashed,
                role: client_1.Role.ADMIN,
                isActive: true,
            },
            {
                name: "Laxman",
                email: "laxman@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.PHOTO_TEAM,
                designation: "Photo Editor",
                isActive: true,
            },
            {
                name: "Shashi",
                email: "shashi@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.CINEMATIC_TEAM,
                designation: "Cinematic Video Editor",
                isActive: true,
            },
            {
                name: "Asha",
                email: "asha@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.CINEMATIC_TEAM,
                designation: "Cinematic Video Editor",
                isActive: true,
            },
            {
                name: "Anil",
                email: "anil@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.TRADITIONAL_TEAM,
                designation: "Traditional Video Editor",
                isActive: true,
            },
            {
                name: "Emmanuel",
                email: "emmanuel@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.DATA_MANAGEMENT,
                designation: "Data Copy and Management",
                isActive: true,
            },
            {
                name: "Venkatesh",
                email: "venkatesh@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.PHOTO_TEAM,
                designation: "Photo Editor",
                isActive: true,
            },
            {
                name: "Ravindra",
                email: "ravindra@wedding.local",
                password: hashed,
                role: client_1.Role.TEAM_MEMBER,
                team: client_1.Team.ALBUM_TEAM,
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
    const mkDeadline = (days) => {
        const d = new Date(eventDate);
        d.setDate(d.getDate() + days);
        return d;
    };
    await prisma.task.createMany({
        data: [
            {
                eventId: sampleEvent.id,
                taskType: client_1.TaskType.PREVIEW_PHOTOS,
                assignedTeam: client_1.Team.PHOTO_TEAM,
                deadline: mkDeadline(7),
                status: client_1.TaskStatus.PENDING,
                priority: client_1.TaskPriority.MEDIUM,
            },
            {
                eventId: sampleEvent.id,
                taskType: client_1.TaskType.FULL_PHOTOS,
                assignedTeam: client_1.Team.PHOTO_TEAM,
                deadline: mkDeadline(20),
                status: client_1.TaskStatus.PENDING,
                priority: client_1.TaskPriority.LOW,
            },
            {
                eventId: sampleEvent.id,
                taskType: client_1.TaskType.CINEMATIC_VIDEO,
                assignedTeam: client_1.Team.CINEMATIC_TEAM,
                deadline: mkDeadline(30),
                status: client_1.TaskStatus.PENDING,
                priority: client_1.TaskPriority.LOW,
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
