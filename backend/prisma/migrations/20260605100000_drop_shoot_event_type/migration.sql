-- DropColumn (revert eventType if it was applied)
ALTER TABLE "ShootCalendarEntry" DROP COLUMN IF EXISTS "eventType";
