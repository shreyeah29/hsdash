import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRoles } from "../middleware/auth";
import { clockIn, clockOut, getTodaySession } from "../services/attendanceService";

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth);
attendanceRouter.use(requireRoles(Role.EDITOR, Role.COORDINATOR));

attendanceRouter.get("/today", async (req, res, next) => {
  try {
    const data = await getTodaySession(req.auth!.userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

attendanceRouter.post("/clock-in", async (req, res, next) => {
  try {
    const data = await clockIn(req.auth!.userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

attendanceRouter.post("/clock-out", async (req, res, next) => {
  try {
    const data = await clockOut(req.auth!.userId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});
