-- AlterTable
ALTER TABLE "AdminCalendarNote" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");
