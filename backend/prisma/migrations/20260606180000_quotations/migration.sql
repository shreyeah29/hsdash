-- AlterEnum
ALTER TYPE "LeadActivityKind" ADD VALUE 'QUOTATION_CREATED';
ALTER TYPE "LeadActivityKind" ADD VALUE 'QUOTATION_SENT';
ALTER TYPE "LeadActivityKind" ADD VALUE 'QUOTATION_VIEWED';
ALTER TYPE "LeadActivityKind" ADD VALUE 'QUOTATION_ACCEPTED';
ALTER TYPE "LeadActivityKind" ADD VALUE 'QUOTATION_REVISION_REQUESTED';

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REVISION_REQUESTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "packageAmount" TEXT NOT NULL,
    "bookingAmount" TEXT NOT NULL,
    "secondPayment" TEXT NOT NULL DEFAULT '',
    "finalPayment" TEXT NOT NULL DEFAULT '',
    "additionalNotes" TEXT NOT NULL DEFAULT '',
    "includeEngagementPackage" BOOLEAN NOT NULL DEFAULT false,
    "engagementPackageAmount" TEXT NOT NULL DEFAULT '',
    "engagementBookingAmount" TEXT NOT NULL DEFAULT '',
    "engagementFinalPayment" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "revisionRequestedAt" TIMESTAMP(3),
    "revisionMessage" TEXT NOT NULL DEFAULT '',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationEvent" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "eventName" TEXT NOT NULL,
    "venue" TEXT NOT NULL DEFAULT '',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "teamSize" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "QuotationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationView" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_slug_key" ON "Quotation"("slug");

-- CreateIndex
CREATE INDEX "Quotation_leadId_idx" ON "Quotation"("leadId");

-- CreateIndex
CREATE INDEX "Quotation_slug_idx" ON "Quotation"("slug");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

-- CreateIndex
CREATE INDEX "QuotationEvent_quotationId_idx" ON "QuotationEvent"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationView_quotationId_idx" ON "QuotationView"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationView_createdAt_idx" ON "QuotationView"("createdAt");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationEvent" ADD CONSTRAINT "QuotationEvent_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationView" ADD CONSTRAINT "QuotationView_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
