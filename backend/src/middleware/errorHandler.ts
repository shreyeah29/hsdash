import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join(" · ") || "Validation failed";
    return res.status(400).json({
      error: "ValidationError",
      message,
      details: err.issues,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.code ?? "HttpError",
      message: err.message,
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "InternalServerError" });
}

