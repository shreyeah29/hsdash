import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client";
import { requireAuth } from "../middleware/auth";
import { HttpError } from "../utils/httpError";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const auth = req.auth!;
    const notifications = await prisma.userNotification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        task: {
          include: {
            event: true,
            assignedTo: { select: { id: true, name: true, email: true, team: true } },
          },
        },
      },
    });
    res.json({ notifications });
  } catch (e) {
    next(e);
  }
});

notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const auth = req.auth!;
    const result = await prisma.userNotification.updateMany({
      where: { id, userId: auth.userId },
      data: { read: true },
    });
    if (result.count === 0) throw new HttpError(404, "Not found", "NOT_FOUND");
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

notificationsRouter.post("/read-all", async (req, res, next) => {
  try {
    const auth = req.auth!;
    await prisma.userNotification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
