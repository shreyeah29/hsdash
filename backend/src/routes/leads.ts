import { Router } from "express";
import { z } from "zod";
import { LeadEventType } from "@prisma/client";
import { rateLimit } from "../middleware/rateLimit";
import { isValidPhone } from "../utils/phone";
import { createLeadFromPublic } from "../services/leadService";
import { HttpError } from "../utils/httpError";

export const leadsRouter = Router();

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const publicLeadSchema = z
  .object({
    phoneNumber: z.string().min(8).max(20),
    eventDate: isoDay,
    eventLocation: z.string().min(1).max(300),
    eventType: z.enum(["WEDDING", "OTHER"]),
    name: z.string().max(200).optional().default(""),
    brideName: z.string().max(200).optional().default(""),
    groomName: z.string().max(200).optional().default(""),
    clientName: z.string().max(200).optional().default(""),
    message: z.string().max(5000).optional().default(""),
    website: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (!isValidPhone(data.phoneNumber)) {
      ctx.addIssue({ code: "custom", message: "Invalid phone number", path: ["phoneNumber"] });
    }
    if (data.eventType === "WEDDING") {
      if (!data.brideName.trim() && !data.groomName.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Bride or groom name is required for weddings",
          path: ["brideName"],
        });
      }
    } else if (!data.clientName.trim() && !data.name.trim()) {
      ctx.addIssue({ code: "custom", message: "Client name is required", path: ["clientName"] });
    }
  });

/** Public enquiry form — no auth required. */
leadsRouter.post("/", async (req, res, next) => {
  try {
    const ip = String(req.ip ?? req.socket.remoteAddress ?? "unknown");
    if (!rateLimit(`lead:${ip}`, 5, 15 * 60 * 1000)) {
      throw new HttpError(429, "Too many submissions. Please try again later.");
    }

    const body = publicLeadSchema.parse(req.body);
    if (body.website.trim()) {
      res.status(201).json({ ok: true, leadId: "ignored" });
      return;
    }

    const lead = await createLeadFromPublic({
      phoneNumber: body.phoneNumber,
      eventDate: body.eventDate,
      eventLocation: body.eventLocation,
      eventType: body.eventType as LeadEventType,
      name: body.name,
      brideName: body.brideName,
      groomName: body.groomName,
      clientName: body.clientName,
      message: body.message,
    });

    res.status(201).json({ ok: true, leadId: lead.id });
  } catch (e) {
    next(e);
  }
});
