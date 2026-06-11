-- Add username for login; backfill from legacy email local-part; email becomes optional.

ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" = lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
WHERE "username" IS NULL;

UPDATE "User"
SET "username" = "username" || substr("id", 1, 4)
WHERE "username" IS NULL OR length("username") < 3;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";

ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
