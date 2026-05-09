-- CreateTable
CREATE TABLE "ShootCalendarEntry" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientType" TEXT NOT NULL DEFAULT '',
    "eventName" TEXT NOT NULL DEFAULT '',
    "startTime" TEXT NOT NULL DEFAULT '',
    "endTime" TEXT NOT NULL DEFAULT '',
    "photoTeam" TEXT NOT NULL DEFAULT '',
    "videoTeam" TEXT NOT NULL DEFAULT '',
    "addons" TEXT NOT NULL DEFAULT '',
    "createdById" TEXT NOT NULL,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShootCalendarEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShootCalendarEntry_eventId_key" ON "ShootCalendarEntry"("eventId");

CREATE INDEX "ShootCalendarEntry_day_idx" ON "ShootCalendarEntry"("day");

ALTER TABLE "ShootCalendarEntry" ADD CONSTRAINT "ShootCalendarEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShootCalendarEntry" ADD CONSTRAINT "ShootCalendarEntry_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
