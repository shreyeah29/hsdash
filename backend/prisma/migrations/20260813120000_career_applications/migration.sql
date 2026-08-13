-- CreateEnum
CREATE TYPE "CareerApplicationStatus" AS ENUM ('NEW', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CareerApplicationSource" AS ENUM ('GOOGLE_FORM', 'WEBSITE', 'MANUAL', 'IMPORT');

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" TEXT NOT NULL,
    "status" "CareerApplicationStatus" NOT NULL DEFAULT 'NEW',
    "source" "CareerApplicationSource" NOT NULL DEFAULT 'GOOGLE_FORM',
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "phoneNormalized" TEXT NOT NULL DEFAULT '',
    "roleApplied" TEXT NOT NULL DEFAULT '',
    "softwares" TEXT NOT NULL DEFAULT '',
    "experience" TEXT NOT NULL DEFAULT '',
    "portfolioUrl" TEXT NOT NULL DEFAULT '',
    "instagramLink" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "externalId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_externalId_key" ON "CareerApplication"("externalId");

-- CreateIndex
CREATE INDEX "CareerApplication_status_idx" ON "CareerApplication"("status");

-- CreateIndex
CREATE INDEX "CareerApplication_roleApplied_idx" ON "CareerApplication"("roleApplied");

-- CreateIndex
CREATE INDEX "CareerApplication_phoneNormalized_idx" ON "CareerApplication"("phoneNormalized");

-- CreateIndex
CREATE INDEX "CareerApplication_submittedAt_idx" ON "CareerApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "CareerApplication_createdAt_idx" ON "CareerApplication"("createdAt");
