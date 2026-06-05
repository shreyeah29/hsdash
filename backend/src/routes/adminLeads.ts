import { Router } from "express";
import { z } from "zod";
import { LeadEventType, LeadSource, LeadStatus, type Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  addLeadNote,
  assignLead,
  convertLeadToClient,
  createLeadManual,
  leadInclude,
  leadIncludeDetail,
  updateLeadStatus,
} from "../services/leadService";
import { listQuotationsForLeadSummary } from "../services/quotationService";
import { isValidPhone } from "../utils/phone";

export const adminLeadsRouter = Router();

adminLeadsRouter.use(requireAuth, requireRole(Role.ADMIN));

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const leadInputSchema = z
  .object({
    phoneNumber: z.string().min(8).max(20),
    email: z.string().max(200).optional().default(""),
    eventDate: isoDay,
    eventLocation: z.string().min(1).max(300),
    eventType: z.nativeEnum(LeadEventType),
    name: z.string().max(200).optional().default(""),
    brideName: z.string().max(200).optional().default(""),
    groomName: z.string().max(200).optional().default(""),
    clientName: z.string().max(200).optional().default(""),
    message: z.string().max(5000).optional().default(""),
    source: z.nativeEnum(LeadSource).optional(),
    status: z.nativeEnum(LeadStatus).optional(),
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

adminLeadsRouter.get("/stats", async (_req, res, next) => {
  try {
    const [total, byStatus, bySource, converted, monthly] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
      prisma.lead.count({ where: { convertedEntryId: { not: null } } }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM "Lead"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all]));
    const sourceMap = Object.fromEntries(bySource.map((r) => [r.source, r._count._all]));
    const lost = statusMap.LOST ?? 0;
    const confirmed = statusMap.CONFIRMED ?? 0;
    const conversionRate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;

    res.json({
      total,
      new: statusMap.NEW ?? 0,
      contacted: statusMap.CONTACTED ?? 0,
      negotiation: statusMap.NEGOTIATION ?? 0,
      confirmed,
      lost,
      archived: statusMap.ARCHIVED ?? 0,
      converted,
      conversionRate,
      sources: sourceMap,
      monthlyTrend: monthly.map((r) => ({ month: r.month, count: Number(r.count) })),
    });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({
        status: z.nativeEnum(LeadStatus).optional(),
        source: z.nativeEnum(LeadSource).optional(),
        search: z.string().max(200).optional(),
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(30),
      })
      .parse(req.query);

    const where: Prisma.LeadWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.source) where.source = q.source;
    if (q.search?.trim()) {
      const needle = q.search.trim();
      where.OR = [
        { name: { contains: needle, mode: "insensitive" } },
        { clientName: { contains: needle, mode: "insensitive" } },
        { brideName: { contains: needle, mode: "insensitive" } },
        { groomName: { contains: needle, mode: "insensitive" } },
        { phoneNumber: { contains: needle } },
        { email: { contains: needle, mode: "insensitive" } },
        { eventLocation: { contains: needle, mode: "insensitive" } },
      ];
    }

    const skip = (q.page - 1) * q.limit;
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: q.limit,
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page: q.page, limit: q.limit });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.post("/", async (req, res, next) => {
  try {
    const body = leadInputSchema.parse(req.body);
    const lead = await createLeadManual(body, req.auth!.userId);
    res.status(201).json({ lead });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.get("/:id/bundle", async (req, res, next) => {
  try {
    const leadId = req.params.id;
    const [lead, quotations] = await Promise.all([
      prisma.lead.findUnique({
        where: { id: leadId },
        include: leadIncludeDetail,
      }),
      listQuotationsForLeadSummary(leadId),
    ]);
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json({ lead, quotations });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.get("/:id", async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: leadIncludeDetail,
    });
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json({ lead });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        status: z.nativeEnum(LeadStatus).optional(),
        source: z.nativeEnum(LeadSource).optional(),
        assignedToId: z.string().nullable().optional(),
      })
      .parse(req.body);

    let lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    if (body.status && body.status !== lead.status) {
      lead = await updateLeadStatus(req.params.id, body.status, req.auth!.userId);
    }
    if (body.assignedToId !== undefined && body.assignedToId !== lead.assignedToId) {
      lead = await assignLead(req.params.id, body.assignedToId, req.auth!.userId);
    }
    if (body.source) {
      lead = await prisma.lead.update({
        where: { id: req.params.id },
        data: { source: body.source },
      });
    }

    const full = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: leadIncludeDetail,
    });
    res.json({ lead: full });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.post("/:id/notes", async (req, res, next) => {
  try {
    const body = z.object({ content: z.string().min(1).max(5000) }).parse(req.body);
    const note = await addLeadNote(req.params.id, body.content, req.auth!.userId);
    res.status(201).json({ note });
  } catch (e) {
    next(e);
  }
});

adminLeadsRouter.post("/:id/convert", async (req, res, next) => {
  try {
    const result = await convertLeadToClient(req.params.id, req.auth!.userId);
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: leadIncludeDetail,
    });
    res.json({ ...result, lead });
  } catch (e) {
    next(e);
  }
});
