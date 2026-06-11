-- CreateEnum
CREATE TYPE "AttendanceAlertKind" AS ENUM ('LATE_CLOCK_IN', 'EARLY_CLOCK_OUT');

-- CreateTable
CREATE TABLE "WorkShiftSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkShiftSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "day" TEXT NOT NULL,
    "kind" "AttendanceAlertKind" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkShiftSession_day_idx" ON "WorkShiftSession"("day");

-- CreateIndex
CREATE UNIQUE INDEX "WorkShiftSession_userId_day_key" ON "WorkShiftSession"("userId", "day");

-- CreateIndex
CREATE INDEX "AttendanceAlert_day_idx" ON "AttendanceAlert"("day");

-- CreateIndex
CREATE INDEX "AttendanceAlert_occurredAt_idx" ON "AttendanceAlert"("occurredAt");

-- AddForeignKey
ALTER TABLE "WorkShiftSession" ADD CONSTRAINT "WorkShiftSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAlert" ADD CONSTRAINT "AttendanceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAlert" ADD CONSTRAINT "AttendanceAlert_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkShiftSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
