import { Router } from "express";
import { z } from "zod";
import { CareerApplicationSource } from "@prisma/client";
import { rateLimit } from "../middleware/rateLimit";
import { isValidPhone } from "../utils/phone";
import { createCareerApplication } from "../services/careerService";
import { HttpError } from "../utils/httpError";

export const careersRouter = Router();

const publicCareerSchema = z
  .object({
    name: z.string().max(200).optional().default(""),
    email: z.string().max(200).optional().default(""),
    phoneNumber: z.string().min(8).max(30),
    roleApplied: z.string().min(1).max(120),
    softwares: z.string().max(2000).optional().default(""),
    experience: z.string().max(120).optional().default(""),
    portfolioUrl: z.string().max(1000).optional().default(""),
    instagramLink: z.string().max(1000).optional().default(""),
    notes: z.string().max(5000).optional().default(""),
    externalId: z.string().max(200).optional(),
    submittedAt: z.string().datetime().optional(),
    /** Honeypot — bots fill this; humans leave blank. */
    website: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (!isValidPhone(data.phoneNumber)) {
      ctx.addIssue({ code: "custom", message: "Invalid phone number", path: ["phoneNumber"] });
    }
    const email = data.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({ code: "custom", message: "Invalid email address", path: ["email"] });
    }
  });

function assertIngestAllowed(headerValue: string | undefined) {
  const secret = process.env.CAREERS_INGEST_SECRET?.trim();
  if (!secret) return; // open + rate-limited when secret unset
  if ((headerValue ?? "").trim() !== secret) {
    throw new HttpError(401, "Invalid careers ingest secret", "UNAUTHORIZED");
  }
}

/**
 * Public JOIN US ingest — used by Google Apps Script on form submit.
 * No session auth. Optional CAREERS_INGEST_SECRET via X-Careers-Secret header.
 */
careersRouter.post("/", async (req, res, next) => {
  try {
    const ip = String(req.ip ?? req.socket.remoteAddress ?? "unknown");
    if (!rateLimit(`career:${ip}`, 20, 15 * 60 * 1000)) {
      throw new HttpError(429, "Too many submissions. Please try again later.");
    }

    assertIngestAllowed(
      typeof req.headers["x-careers-secret"] === "string" ? req.headers["x-careers-secret"] : undefined,
    );

    const body = publicCareerSchema.parse(req.body);
    if (body.website.trim()) {
      res.status(201).json({ ok: true, applicationId: "ignored" });
      return;
    }

    const application = await createCareerApplication({
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      roleApplied: body.roleApplied,
      softwares: body.softwares,
      experience: body.experience,
      portfolioUrl: body.portfolioUrl,
      instagramLink: body.instagramLink,
      notes: body.notes,
      source: CareerApplicationSource.GOOGLE_FORM,
      externalId: body.externalId,
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : undefined,
    });

    res.status(201).json({ ok: true, applicationId: application.id });
  } catch (e) {
    next(e);
  }
});
