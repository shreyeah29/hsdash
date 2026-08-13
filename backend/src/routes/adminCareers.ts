import { Router } from "express";
import { z } from "zod";
import { CareerApplicationStatus, Role, type Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  careerSelect,
  deleteCareerApplication,
  updateCareerApplication,
} from "../services/careerService";

export const adminCareersRouter = Router();

adminCareersRouter.use(requireAuth, requireRole(Role.ADMIN));

adminCareersRouter.get("/stats", async (_req, res, next) => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.careerApplication.count(),
      prisma.careerApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all]));
    res.json({
      total,
      new: statusMap.NEW ?? 0,
      reviewing: statusMap.REVIEWING ?? 0,
      shortlisted: statusMap.SHORTLISTED ?? 0,
      rejected: statusMap.REJECTED ?? 0,
      hired: statusMap.HIRED ?? 0,
      archived: statusMap.ARCHIVED ?? 0,
    });
  } catch (e) {
    next(e);
  }
});

adminCareersRouter.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({
        status: z.nativeEnum(CareerApplicationStatus).optional(),
        search: z.string().max(200).optional(),
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(50),
      })
      .parse(req.query);

    const where: Prisma.CareerApplicationWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.search?.trim()) {
      const needle = q.search.trim();
      where.OR = [
        { name: { contains: needle, mode: "insensitive" } },
        { email: { contains: needle, mode: "insensitive" } },
        { phoneNumber: { contains: needle } },
        { roleApplied: { contains: needle, mode: "insensitive" } },
        { experience: { contains: needle, mode: "insensitive" } },
      ];
    }

    const skip = (q.page - 1) * q.limit;
    const [applications, total] = await Promise.all([
      prisma.careerApplication.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: q.limit,
        select: careerSelect,
      }),
      prisma.careerApplication.count({ where }),
    ]);

    res.json({ applications, total, page: q.page, limit: q.limit });
  } catch (e) {
    next(e);
  }
});

adminCareersRouter.get("/:id", async (req, res, next) => {
  try {
    const application = await prisma.careerApplication.findUnique({
      where: { id: req.params.id },
      select: careerSelect,
    });
    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    res.json({ application });
  } catch (e) {
    next(e);
  }
});

adminCareersRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        status: z.nativeEnum(CareerApplicationStatus).optional(),
        notes: z.string().max(5000).optional(),
      })
      .parse(req.body);
    const application = await updateCareerApplication(req.params.id, body);
    res.json({ application });
  } catch (e) {
    next(e);
  }
});

adminCareersRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteCareerApplication(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
