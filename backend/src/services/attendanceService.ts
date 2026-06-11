import { AttendanceAlertKind, Role } from "@prisma/client";
import { prisma } from "../prisma/client";
import { emitAttendanceRefreshToOps, emitNotificationRefresh } from "../realtime/socket";
import {
  formatDurationShort,
  istDayKey,
  minutesEarlyForClockOut,
  minutesLateForClockIn,
  SHIFT_END_HOUR,
  SHIFT_START_HOUR,
  STUDIO_TIMEZONE,
} from "../utils/shiftHours";
import { HttpError } from "../utils/httpError";

function sessionPayload(session: {
  id: string;
  day: string;
  clockInAt: Date;
  clockOutAt: Date | null;
}) {
  return {
    id: session.id,
    day: session.day,
    clockInAt: session.clockInAt.toISOString(),
    clockOutAt: session.clockOutAt?.toISOString() ?? null,
  };
}

async function notifyAdminsAttendance(title: string, body: string) {
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, isActive: true },
    select: { id: true },
  });
  for (const admin of admins) {
    await prisma.userNotification.create({
      data: { userId: admin.id, title, body },
    });
    emitNotificationRefresh(admin.id);
  }
  emitAttendanceRefreshToOps();
}

export function attendanceConfig() {
  return {
    shiftStartHour: SHIFT_START_HOUR,
    shiftEndHour: SHIFT_END_HOUR,
    timezone: STUDIO_TIMEZONE,
  };
}

export async function getTodaySession(userId: string) {
  const day = istDayKey();
  const session = await prisma.workShiftSession.findUnique({
    where: { userId_day: { userId, day } },
  });
  return {
    ...attendanceConfig(),
    session: session ? sessionPayload(session) : null,
  };
}

async function userDisplayName(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!user) throw new HttpError(404, "User not found");
  return user.name;
}

export async function clockIn(userId: string) {
  const userName = await userDisplayName(userId);
  const now = new Date();
  const day = istDayKey(now);
  const existing = await prisma.workShiftSession.findUnique({
    where: { userId_day: { userId, day } },
  });
  if (existing?.clockInAt && !existing.clockOutAt) {
    throw new HttpError(409, "Already clocked in for today");
  }
  if (existing?.clockOutAt) {
    throw new HttpError(409, "Already completed today's shift");
  }

  const session = await prisma.workShiftSession.create({
    data: { userId, day, clockInAt: now },
  });

  const lateMinutes = minutesLateForClockIn(now);
  let alert: { message: string } | null = null;
  if (lateMinutes > 0) {
    const duration = formatDurationShort(lateMinutes);
    const message = `${userName} logged in ${duration} late today`;
    await prisma.attendanceAlert.create({
      data: {
        userId,
        sessionId: session.id,
        day,
        kind: AttendanceAlertKind.LATE_CLOCK_IN,
        minutes: lateMinutes,
        message,
        occurredAt: now,
      },
    });
    await notifyAdminsAttendance("Late clock-in", message);
    alert = { message };
  } else {
    emitAttendanceRefreshToOps();
  }

  return { session: sessionPayload(session), alert };
}

export async function clockOut(userId: string) {
  const userName = await userDisplayName(userId);
  const now = new Date();
  const day = istDayKey(now);
  const session = await prisma.workShiftSession.findUnique({
    where: { userId_day: { userId, day } },
  });
  if (!session?.clockInAt) {
    throw new HttpError(400, "Clock in before clocking out");
  }
  if (session.clockOutAt) {
    throw new HttpError(409, "Already clocked out for today");
  }

  const updated = await prisma.workShiftSession.update({
    where: { id: session.id },
    data: { clockOutAt: now },
  });

  const earlyMinutes = minutesEarlyForClockOut(now);
  let alert: { message: string } | null = null;
  if (earlyMinutes > 0) {
    const duration = formatDurationShort(earlyMinutes);
    const message = `${userName} logged out ${duration} early today`;
    await prisma.attendanceAlert.create({
      data: {
        userId,
        sessionId: session.id,
        day,
        kind: AttendanceAlertKind.EARLY_CLOCK_OUT,
        minutes: earlyMinutes,
        message,
        occurredAt: now,
      },
    });
    await notifyAdminsAttendance("Early clock-out", message);
    alert = { message };
  } else {
    emitAttendanceRefreshToOps();
  }

  return { session: sessionPayload(updated), alert };
}

export async function listAttendanceAlerts(limit: number) {
  return prisma.attendanceAlert.findMany({
    take: limit,
    orderBy: { occurredAt: "desc" },
    include: {
      user: { select: { id: true, name: true, team: true, role: true } },
    },
  });
}
