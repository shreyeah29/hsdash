import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(Role.ADMIN));

usersRouter.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: true,
      designation: true,
      isActive: true,
      createdAt: true,
    },
  });

  // simple assigned tasks count per team member (future: add assignee)
  const taskCounts = await prisma.task.groupBy({
    by: ["assignedTeam"],
    _count: { _all: true },
  });

  res.json({ users, taskCounts });
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.EDITOR),
  team: z.nativeEnum(Team).optional().nullable(),
  designation: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

usersRouter.post("/", async (req, res, next) => {
  try {
    const body = createUserSchema.parse(req.body);
    const password = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password,
        role: body.role,
        team: body.team ?? null,
        designation: body.designation ?? null,
        isActive: body.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role).optional(),
  team: z.nativeEnum(Team).optional().nullable(),
  designation: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

usersRouter.put("/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = updateUserSchema.parse(req.body);

    const data: any = { ...body };
    if (body.password) data.password = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

usersRouter.post("/:id/reset-password", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const body = resetPasswordSchema.parse(req.body);
    const password = await bcrypt.hash(body.password, 12);
    await prisma.user.update({ where: { id }, data: { password } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");
    if (user.role === Role.ADMIN) throw new HttpError(400, "Cannot delete admin user", "BAD_REQUEST");

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

