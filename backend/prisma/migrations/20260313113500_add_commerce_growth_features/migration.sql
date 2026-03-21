-- Add new notification variants for stock alerts and returns
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'stock_alert';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'return_update';

-- Add return request workflow state
CREATE TYPE "ReturnRequestStatus" AS ENUM (
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'RECEIVED',
  'REFUNDED',
  'CLOSED'
);

-- Address book for repeat checkout
CREATE TABLE "SavedAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SavedAddress_userId_idx" ON "SavedAddress"("userId");
CREATE INDEX "SavedAddress_userId_isDefault_idx" ON "SavedAddress"("userId", "isDefault");

ALTER TABLE "SavedAddress"
ADD CONSTRAINT "SavedAddress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Back-in-stock subscriptions
CREATE TABLE "StockAlertSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StockAlertSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockAlertSubscription_userId_bookId_key"
ON "StockAlertSubscription"("userId", "bookId");

CREATE INDEX "StockAlertSubscription_bookId_isActive_idx"
ON "StockAlertSubscription"("bookId", "isActive");

ALTER TABLE "StockAlertSubscription"
ADD CONSTRAINT "StockAlertSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockAlertSubscription"
ADD CONSTRAINT "StockAlertSubscription_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Structured return and refund workflow
CREATE TABLE "ReturnRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookId" TEXT,
  "status" "ReturnRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "requestedQty" INTEGER NOT NULL DEFAULT 1,
  "resolutionNote" TEXT,
  "refundAmount" DECIMAL(10,2),
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");
CREATE INDEX "ReturnRequest_userId_idx" ON "ReturnRequest"("userId");
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE INDEX "ReturnRequest_bookId_idx" ON "ReturnRequest"("bookId");

ALTER TABLE "ReturnRequest"
ADD CONSTRAINT "ReturnRequest_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReturnRequest"
ADD CONSTRAINT "ReturnRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReturnRequest"
ADD CONSTRAINT "ReturnRequest_bookId_fkey"
FOREIGN KEY ("bookId") REFERENCES "Book"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReturnRequest"
ADD CONSTRAINT "ReturnRequest_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
