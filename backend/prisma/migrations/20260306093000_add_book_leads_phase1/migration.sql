-- CreateEnum
CREATE TYPE "BookLeadStatus" AS ENUM (
  'NEW',
  'REVIEWED',
  'SOURCING',
  'APPROVED_TO_BUY',
  'ORDERED',
  'CONVERTED_TO_BOOK',
  'REJECTED'
);

-- CreateEnum
CREATE TYPE "BookLeadSource" AS ENUM (
  'USER_REQUEST',
  'STAFF_IDEA',
  'PARTNER_PITCH'
);

-- CreateTable
CREATE TABLE "BookLead" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "note" TEXT,
  "source" "BookLeadSource" NOT NULL DEFAULT 'USER_REQUEST',
  "status" "BookLeadStatus" NOT NULL DEFAULT 'NEW',
  "priority" INTEGER NOT NULL DEFAULT 3,
  "requestedByUserId" TEXT,
  "assignedToUserId" TEXT,
  "convertedBookId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookLead_status_idx" ON "BookLead"("status");

-- CreateIndex
CREATE INDEX "BookLead_source_idx" ON "BookLead"("source");

-- CreateIndex
CREATE INDEX "BookLead_priority_idx" ON "BookLead"("priority");

-- CreateIndex
CREATE INDEX "BookLead_createdAt_idx" ON "BookLead"("createdAt");
