import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export function isProductionCoordinator(auth: NonNullable<Request["auth"]>): boolean {
  const want = env.CALENDAR_COORDINATOR_EMAIL.trim().toLowerCase();
  const got = auth.email?.trim().toLowerCase() ?? "";
  return got.length > 0 && got === want;
}

/** Full production dashboard (assign tasks, edit shoot calendar): admin or designated coordinator. */
export function requireCoordinatorOrAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(new HttpError(401, "Not authenticated", "UNAUTHENTICATED"));
  if (req.auth.role === Role.ADMIN || isProductionCoordinator(req.auth)) return next();
  return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
}

