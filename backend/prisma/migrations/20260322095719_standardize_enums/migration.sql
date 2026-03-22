/*
  Warnings:

  - The values [new,archived] on the enum `ContactStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [support,author,publisher,business,legal] on the enum `ContactType` will be removed. If these variants are still used in the database, this will fail.
  - The values [order,payment,legal,author,stock,other] on the enum `InquiryType` will be removed. If these variants are still used in the database, this will fail.
  - The values [support_reply,announcement,inquiry_update,system,blog_like,blog_comment,blog_follow,inquiry_created,inquiry_assigned,inquiry_escalated,inquiry_reply,stock_alert,return_update] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryOwnershipType" AS ENUM ('OWNED', 'CONSIGNMENT');

-- CreateEnum
CREATE TYPE "InventoryLocationType" AS ENUM ('WAREHOUSE', 'STORE');

-- CreateEnum
CREATE TYPE "InventoryLotSourceType" AS ENUM ('PURCHASE_ORDER', 'PARTNER_CONSIGNMENT', 'STOCK_ADJUSTMENT', 'WAREHOUSE_TRANSFER', 'STORE_TRANSFER');

-- AlterEnum
BEGIN;
CREATE TYPE "ContactStatus_new" AS ENUM ('NEW', 'ARCHIVED');
ALTER TABLE "ContactMessage" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ContactMessage" ALTER COLUMN "status" TYPE "ContactStatus_new" USING ("status"::text::"ContactStatus_new");
ALTER TYPE "ContactStatus" RENAME TO "ContactStatus_old";
ALTER TYPE "ContactStatus_new" RENAME TO "ContactStatus";
DROP TYPE "ContactStatus_old";
ALTER TABLE "ContactMessage" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ContactType_new" AS ENUM ('SUPPORT', 'AUTHOR', 'PUBLISHER', 'BUSINESS', 'LEGAL');
ALTER TABLE "ContactMessage" ALTER COLUMN "type" TYPE "ContactType_new" USING ("type"::text::"ContactType_new");
ALTER TABLE "ContactNotification" ALTER COLUMN "type" TYPE "ContactType_new" USING ("type"::text::"ContactType_new");
ALTER TYPE "ContactType" RENAME TO "ContactType_old";
ALTER TYPE "ContactType_new" RENAME TO "ContactType";
DROP TYPE "ContactType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "InquiryType_new" AS ENUM ('ORDER', 'PAYMENT', 'LEGAL', 'AUTHOR', 'STOCK', 'OTHER');
ALTER TABLE "Inquiry" ALTER COLUMN "type" TYPE "InquiryType_new" USING ("type"::text::"InquiryType_new");
ALTER TABLE "InquiryQuickReplyTemplate" ALTER COLUMN "type" TYPE "InquiryType_new" USING ("type"::text::"InquiryType_new");
ALTER TYPE "InquiryType" RENAME TO "InquiryType_old";
ALTER TYPE "InquiryType_new" RENAME TO "InquiryType";
DROP TYPE "InquiryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('SUPPORT_REPLY', 'ANNOUNCEMENT', 'INQUIRY_UPDATE', 'SYSTEM', 'BLOG_LIKE', 'BLOG_COMMENT', 'BLOG_FOLLOW', 'INQUIRY_CREATED', 'INQUIRY_ASSIGNED', 'INQUIRY_ESCALATED', 'INQUIRY_REPLY', 'STOCK_ALERT', 'RETURN_UPDATE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "ContactMessage" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "StaffProfile" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "dateJoined" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "salary" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "StaffPayroll" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPayroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "locationType" "InventoryLocationType" NOT NULL,
    "warehouseId" TEXT,
    "storeId" TEXT,
    "ownershipType" "InventoryOwnershipType" NOT NULL,
    "sourceType" "InventoryLotSourceType" NOT NULL,
    "purchaseOrderItemId" TEXT,
    "vendorId" TEXT,
    "partnerDealId" TEXT,
    "sourceLotId" TEXT,
    "unitCost" DECIMAL(10,2),
    "revenueSharePct" DECIMAL(5,2),
    "receivedQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemInventoryAllocation" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "ownershipType" "InventoryOwnershipType" NOT NULL,
    "unitCostAtAllocation" DECIMAL(10,2),
    "revenueSharePctSnapshot" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItemInventoryAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffPayroll_staffProfileId_idx" ON "StaffPayroll"("staffProfileId");

-- CreateIndex
CREATE INDEX "StaffPayroll_status_idx" ON "StaffPayroll"("status");

-- CreateIndex
CREATE INDEX "InventoryLot_bookId_locationType_receivedAt_idx" ON "InventoryLot"("bookId", "locationType", "receivedAt");

-- CreateIndex
CREATE INDEX "InventoryLot_warehouseId_bookId_receivedAt_idx" ON "InventoryLot"("warehouseId", "bookId", "receivedAt");

-- CreateIndex
CREATE INDEX "InventoryLot_storeId_bookId_receivedAt_idx" ON "InventoryLot"("storeId", "bookId", "receivedAt");

-- CreateIndex
CREATE INDEX "InventoryLot_ownershipType_idx" ON "InventoryLot"("ownershipType");

-- CreateIndex
CREATE INDEX "InventoryLot_sourceType_idx" ON "InventoryLot"("sourceType");

-- CreateIndex
CREATE INDEX "InventoryLot_partnerDealId_idx" ON "InventoryLot"("partnerDealId");

-- CreateIndex
CREATE INDEX "InventoryLot_vendorId_idx" ON "InventoryLot"("vendorId");

-- CreateIndex
CREATE INDEX "OrderItemInventoryAllocation_orderItemId_idx" ON "OrderItemInventoryAllocation"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemInventoryAllocation_inventoryLotId_idx" ON "OrderItemInventoryAllocation"("inventoryLotId");

-- AddForeignKey
ALTER TABLE "StaffPayroll" ADD CONSTRAINT "StaffPayroll_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_partnerDealId_fkey" FOREIGN KEY ("partnerDealId") REFERENCES "PartnerConsignmentDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_sourceLotId_fkey" FOREIGN KEY ("sourceLotId") REFERENCES "InventoryLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemInventoryAllocation" ADD CONSTRAINT "OrderItemInventoryAllocation_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "InventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemInventoryAllocation" ADD CONSTRAINT "OrderItemInventoryAllocation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
