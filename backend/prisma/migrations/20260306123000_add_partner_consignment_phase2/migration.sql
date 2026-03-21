-- CreateEnum
CREATE TYPE "PartnerDealStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "PartnerSettlementStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "PartnerConsignmentDeal" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerCompany" TEXT,
    "partnerEmail" TEXT,
    "leadId" TEXT,
    "bookId" TEXT,
    "status" "PartnerDealStatus" NOT NULL DEFAULT 'DRAFT',
    "revenueSharePct" DECIMAL(5,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "termsNote" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerConsignmentDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerSettlement" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossSalesAmount" DECIMAL(12,2) NOT NULL,
    "partnerShareAmount" DECIMAL(12,2) NOT NULL,
    "status" "PartnerSettlementStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerConsignmentDeal_leadId_key" ON "PartnerConsignmentDeal"("leadId");

-- CreateIndex
CREATE INDEX "PartnerConsignmentDeal_status_idx" ON "PartnerConsignmentDeal"("status");

-- CreateIndex
CREATE INDEX "PartnerConsignmentDeal_partnerName_idx" ON "PartnerConsignmentDeal"("partnerName");

-- CreateIndex
CREATE INDEX "PartnerConsignmentDeal_bookId_idx" ON "PartnerConsignmentDeal"("bookId");

-- CreateIndex
CREATE INDEX "PartnerConsignmentDeal_createdAt_idx" ON "PartnerConsignmentDeal"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerSettlement_dealId_idx" ON "PartnerSettlement"("dealId");

-- CreateIndex
CREATE INDEX "PartnerSettlement_status_idx" ON "PartnerSettlement"("status");

-- CreateIndex
CREATE INDEX "PartnerSettlement_periodStart_periodEnd_idx" ON "PartnerSettlement"("periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "PartnerConsignmentDeal" ADD CONSTRAINT "PartnerConsignmentDeal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "BookLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerConsignmentDeal" ADD CONSTRAINT "PartnerConsignmentDeal_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerConsignmentDeal" ADD CONSTRAINT "PartnerConsignmentDeal_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerSettlement" ADD CONSTRAINT "PartnerSettlement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "PartnerConsignmentDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
