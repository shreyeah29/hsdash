import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { HttpError } from "../utils/httpError";

/** Shoot calendar visibility + coordinator tooling: admin or operations coordinator (Emmanuel). */
export function requireCoordinatorOrAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(new HttpError(401, "Not authenticated", "UNAUTHENTICATED"));
  if (req.auth.role === Role.ADMIN || req.auth.role === Role.COORDINATOR) return next();
  return next(new HttpError(403, "Forbidden", "FORBIDDEN"));
}

/** Post-production assignment & roster — coordinator role only (not admin). */
export function requireCoordinator(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth) return next(new HttpError(401, "Not authenticated", "UNAUTHENTICATED"));
  if (req.auth.role === Role.COORDINATOR) return next();
  return next(new HttpError(403, "Only the operations coordinator can do this", "FORBIDDEN"));
}
