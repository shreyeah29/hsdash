import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { Role, Team } from "@prisma/client";
import { HttpError } from "../utils/httpError";
import { getTokenCookieName, signAuthToken } from "../services/jwt";
import { requireAuth } from "../middleware/auth";
import { clearSessionCookie, sessionCookieOptions } from "../services/sessionCookie";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const demoPortalSchema = z.object({
  portal: z.enum(["admin", "team"]).default("admin"),
});

function jsonUser(u: {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: Team | null;
  designation: string | null;
  isActive: boolean;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team,
    designation: u.designation,
    isActive: u.isActive,
  };
}

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw new HttpError(401, "Invalid credentials", "INVALID_CREDENTIALS");

    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      team: user.team ?? null,
    });

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
        : await prisma.user.findFirst({ where: { role: Role.TEAM_MEMBER, isActive: true } });
    if (!user) throw new HttpError(404, "No user found for demo", "NOT_FOUND");

    const token = signAuthToken({
      userId: user.id,
      role: user.role,
      team: user.team ?? null,
    });
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

