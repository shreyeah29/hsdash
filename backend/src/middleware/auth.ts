import type { NextFunction, Request, Response } from "express";
import { Role, Team } from "@prisma/client";
import { getTokenCookieName, verifyAuthToken } from "../services/jwt";
import { HttpError } from "../utils/httpError";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: Role;
        team: Team | null;
      };
    }
  }
}

function readBearer(req: Request): string | undefined {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return undefined;
  const t = h.slice(7).trim();
  return t || undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req) ?? req.cookies?.[getTokenCookieName()];
  if (!token) return next(new HttpError(401, "Not authenticated", "UNAUTHENTICATED"));

  try {
    req.auth = verifyAuthToken(token);
    return next();
  } catch {
    return next(new HttpError(401, "Invalid session", "UNAUTHENTICATED"));
  }
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new HttpError(401, "Not authenticated", "UNAUTHENTICATED"));
    if (req.auth.role !== role) return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
    return next();
  };
}

