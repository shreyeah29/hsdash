-- Role: ADMIN | COORDINATOR | EDITOR
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'COORDINATOR', 'EDITOR');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE
    WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
    WHEN "role"::text = 'TEAM_MEMBER' AND LOWER("email") = 'emmanuel@wedding.local' THEN 'COORDINATOR'::"Role_new"
    WHEN "role"::text = 'TEAM_MEMBER' THEN 'EDITOR'::"Role_new"
    ELSE 'EDITOR'::"Role_new"
  END
);

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EDITOR'::"Role";

-- Team: replace DATA_MANAGEMENT with COORDINATOR_TEAM
CREATE TYPE "Team_new" AS ENUM ('PHOTO_TEAM', 'CINEMATIC_TEAM', 'TRADITIONAL_TEAM', 'ALBUM_TEAM', 'COORDINATOR_TEAM');

ALTER TABLE "Task" ALTER COLUMN "assignedTeam" TYPE "Team_new" USING ("assignedTeam"::text::"Team_new");

ALTER TABLE "User" ALTER COLUMN "team" TYPE "Team_new" USING (
  CASE
    WHEN "team" IS NULL THEN NULL::"Team_new"
    WHEN "team"::text = 'DATA_MANAGEMENT' THEN 'COORDINATOR_TEAM'::"Team_new"
    ELSE "team"::text::"Team_new"
  END
);

DROP TYPE "Team";
ALTER TYPE "Team_new" RENAME TO "Team";

-- TaskType: drop unused DATA_MANAGEMENT value
CREATE TYPE "TaskType_new" AS ENUM ('PREVIEW_PHOTOS', 'FULL_PHOTOS', 'CINEMATIC_VIDEO', 'TRADITIONAL_VIDEO', 'ALBUM_DESIGN');

ALTER TABLE "Task" ALTER COLUMN "taskType" TYPE "TaskType_new" USING ("taskType"::text::"TaskType_new");

DROP TYPE "TaskType";
ALTER TYPE "TaskType_new" RENAME TO "TaskType";

-- Event: shoot + post-production metadata
ALTER TABLE "Event" ADD COLUMN "venue" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "shootTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Event" ADD COLUMN "postProductionStarted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "createdById" TEXT;

ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- Shoot calendar: venue on-site
ALTER TABLE "ShootCalendarEntry" ADD COLUMN "venue" TEXT NOT NULL DEFAULT '';

-- Task: who assigned (coordinator)
ALTER TABLE "Task" ADD COLUMN "assignedById" TEXT;

ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Task_assignedById_idx" ON "Task"("assignedById");
