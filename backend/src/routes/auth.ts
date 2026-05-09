import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/httpError";
import { getTokenCookieName, signAuthToken } from "../services/jwt";
import { requireAuth } from "../middleware/auth";
import { clearSessionCookie, sessionCookieOptions } from "../services/sessionCookie";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        designation: user.designation,
        isActive: user.isActive,
      },
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        designation: user.designation,
        isActive: user.isActive,
      },
    });
  } catch (e) {
    return next(e);
  }
});

