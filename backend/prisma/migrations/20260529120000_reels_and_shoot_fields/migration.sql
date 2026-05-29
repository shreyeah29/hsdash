-- Add REELS deliverable type
ALTER TYPE "TaskType" ADD VALUE 'REELS';

-- Extra shoot-log fields for Excel export
ALTER TABLE "ShootCalendarEntry" ADD COLUMN "clientContact" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShootCalendarEntry" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShootCalendarEntry" ADD COLUMN "muhuruthamTime" TEXT NOT NULL DEFAULT '';
