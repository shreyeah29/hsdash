-- Reusable shoot clients: bride/groom + phone on calendar entries
ALTER TABLE "ShootCalendarEntry" ADD COLUMN IF NOT EXISTS "brideName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShootCalendarEntry" ADD COLUMN IF NOT EXISTS "groomName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ShootCalendarEntry" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT NOT NULL DEFAULT '';
