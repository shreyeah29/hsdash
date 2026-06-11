import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { Role, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { getTokenCookieName, signAuthToken } from "../services/jwt";
import { requireAuth } from "../middleware/auth";
import { clearSessionCookie, sessionCookieOptions } from "../services/sessionCookie";
import { normalizeUsername, usernameSchema } from "../utils/username";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const demoPortalSchema = z.object({
  portal: z.enum(["admin", "team"]).default("admin"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const changeUsernameSchema = z.object({
  currentPassword: z.string().min(1),
  username: usernameSchema,
});

function jsonUser(u: {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: Role;
  team: Team | null;
  designation: string | null;
  isActive: boolean;
}) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    team: u.team,
    designation: u.designation,
    isActive: u.isActive,
  };
}

function authPayload(user: { id: string; role: Role; team: Team | null; username: string }) {
  return {
    userId: user.id,
    role: user.role,
    team: user.team ?? null,
    username: user.username,
  };
}

function resolveLoginIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return normalizeUsername(trimmed.split('@')[0] ?? trimmed);
  }
  return normalizeUsername(trimmed);
}

async function findUserForLogin(identifier: string) {
  const username = resolveLoginIdentifier(identifier);
  let user = await prisma.user.findUnique({ where: { username } });
  if (!user && identifier.includes('@')) {
    user = await prisma.user.findFirst({ where: { email: identifier.trim().toLowerCase() } });
  }
  return user;
}

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await findUserForLogin(body.username);
    if (!user || !user.isActive) throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const token = signAuthToken(authPayload(user));

    res.cookie(getTokenCookieName(), token, sessionCookieOptions());

    return res.json({
      user: jsonUser(user),
      accessToken: token,
    });
  } catch (e) {
    return next(e);
  }
});

/** No password — only when DEMO_LOGIN=true on the API (temporary UX). */
authRouter.post("/demo", async (req, res, next) => {
  try {
    if (process.env.DEMO_LOGIN !== "true") {
      throw new HttpError(403, "Demo login is disabled", "DEMO_DISABLED");
    }
    const { portal } = demoPortalSchema.parse(req.body ?? {});
    const user =
      portal === "admin"
        ? await prisma.user.findFirst({ where: { role: Role.ADMIN, isActive: true } })
        : await prisma.user.findFirst({ where: { role: Role.EDITOR, isActive: true }, orderBy: { name: "asc" } });
    if (!user) throw new HttpError(404, "No user found for demo", "NOT_FOUND");

    const token = signAuthToken(authPayload(user));
    res.cookie(getTokenCookieName(), token, sessionCookieOptions());
    return res.json({
      user: jsonUser(user),
      accessToken: token,
    });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const auth = req.auth!;
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid session", "UNAUTHENTICATED");

    return res.json({
      user: jsonUser(user),
    });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid session", "UNAUTHENTICATED");

    const currentOk = await bcrypt.compare(body.currentPassword, user.password);
    if (!currentOk) {
      throw new HttpError(400, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    if (body.currentPassword === body.newPassword) {
      throw new HttpError(400, "New password must be different from your current password", "SAME_PASSWORD");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(body.newPassword, 12) },
    });

    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

authRouter.post("/change-username", requireAuth, async (req, res, next) => {
  try {
    const body = changeUsernameSchema.parse(req.body);
    const nextUsername = normalizeUsername(body.username);
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid session", "UNAUTHENTICATED");

    const currentOk = await bcrypt.compare(body.currentPassword, user.password);
    if (!currentOk) {
      throw new HttpError(400, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    if (nextUsername === user.username) {
      throw new HttpError(400, "Choose a different username", "SAME_USERNAME");
    }

    const taken = await prisma.user.findUnique({ where: { username: nextUsername } });
    if (taken) {
      throw new HttpError(409, "Username is already taken", "USERNAME_TAKEN");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username: nextUsername },
    });

    return res.json({ user: jsonUser(updated) });
  } catch (e) {
    return next(e);
  }
});
