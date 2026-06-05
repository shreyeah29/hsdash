import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  createQuotation,
  listQuotationsForLead,
  quotationInclude,
} from "../services/quotationService";
import { prisma } from "../prisma/client";

export const adminQuotationsRouter = Router();

adminQuotationsRouter.use(requireAuth, requireRole(Role.ADMIN));

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const eventSchema = z.object({
  eventName: z.string().min(1).max(200),
  venue: z.string().max(300).optional().default(""),
  eventDate: isoDay,
  teamSize: z.string().max(100).optional().default(""),
  duration: z.string().max(100).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

const createSchema = z.object({
  packageAmount: z.string().min(1).max(200),
  bookingAmount: z.string().min(1).max(200),
  secondPayment: z.string().max(200).optional().default(""),
  finalPayment: z.string().max(200).optional().default(""),
  additionalNotes: z.string().max(5000).optional().default(""),
  includeEngagementPackage: z.boolean().optional().default(false),
  engagementPackageAmount: z.string().max(200).optional().default(""),
  engagementBookingAmount: z.string().max(200).optional().default(""),
  engagementFinalPayment: z.string().max(200).optional().default(""),
  expiresAt: z.string().datetime(),
  events: z.array(eventSchema).min(1).max(30),
});

adminQuotationsRouter.get("/leads/:leadId/quotations", async (req, res, next) => {
  try {
    const quotations = await listQuotationsForLead(req.params.leadId);
    res.json({ quotations });
  } catch (e) {
    next(e);
  }
});

adminQuotationsRouter.post("/leads/:leadId/quotations", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const quotation = await createQuotation(req.params.leadId, body, req.auth!.userId);
    res.status(201).json({ quotation });
  } catch (e) {
    next(e);
  }
});

adminQuotationsRouter.get("/quotations/:id", async (req, res, next) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: quotationInclude,
    });
    if (!quotation) {
      res.status(404).json({ error: "Quotation not found" });
      return;
    }
    res.json({ quotation });
  } catch (e) {
    next(e);
  }
});
