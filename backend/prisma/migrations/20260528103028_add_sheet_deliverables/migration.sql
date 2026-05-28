-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskType" ADD VALUE 'CINEMATIC_HIGHLIGHT';
ALTER TYPE "TaskType" ADD VALUE 'ALBUM_PRINT';
ALTER TYPE "TaskType" ADD VALUE 'DATA_COPY';
