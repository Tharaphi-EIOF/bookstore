CREATE TYPE "StickerLedgerType" AS ENUM (
  'ORDER_EARN',
  'ADMIN_GRANT',
  'REWARD_REDEEM'
);

CREATE TYPE "LoyaltyRewardType" AS ENUM (
  'PERCENT_COUPON',
  'FIXED_COUPON',
  'FREE_EBOOK'
);

ALTER TABLE "User"
ADD COLUMN "stickerBalance" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PromotionCode"
ADD COLUMN "assignedUserId" TEXT;

CREATE INDEX "PromotionCode_assignedUserId_idx"
ON "PromotionCode"("assignedUserId");

ALTER TABLE "PromotionCode"
ADD CONSTRAINT "PromotionCode_assignedUserId_fkey"
FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StickerLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "type" "StickerLedgerType" NOT NULL,
  "delta" INTEGER NOT NULL,
  "note" TEXT,
  "orderId" TEXT,
  "redemptionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StickerLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyReward" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "stickerCost" INTEGER NOT NULL,
  "rewardType" "LoyaltyRewardType" NOT NULL,
  "discountValue" DECIMAL(10,2),
  "maxDiscountAmount" DECIMAL(10,2),
  "rewardBookId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "redemptionLimit" INTEGER,
  "redeemedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyRedemption" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "stickerCost" INTEGER NOT NULL,
  "generatedPromoId" TEXT,
  "grantedBookId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LoyaltyRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StickerLedger_userId_createdAt_idx"
ON "StickerLedger"("userId", "createdAt");

CREATE INDEX "StickerLedger_orderId_idx"
ON "StickerLedger"("orderId");

CREATE INDEX "StickerLedger_type_idx"
ON "StickerLedger"("type");

CREATE INDEX "LoyaltyReward_isActive_idx"
ON "LoyaltyReward"("isActive");

CREATE INDEX "LoyaltyReward_rewardBookId_idx"
ON "LoyaltyReward"("rewardBookId");

CREATE INDEX "LoyaltyRedemption_userId_createdAt_idx"
ON "LoyaltyRedemption"("userId", "createdAt");

CREATE INDEX "LoyaltyRedemption_rewardId_idx"
ON "LoyaltyRedemption"("rewardId");

CREATE INDEX "LoyaltyRedemption_generatedPromoId_idx"
ON "LoyaltyRedemption"("generatedPromoId");

ALTER TABLE "StickerLedger"
ADD CONSTRAINT "StickerLedger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StickerLedger"
ADD CONSTRAINT "StickerLedger_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StickerLedger"
ADD CONSTRAINT "StickerLedger_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StickerLedger"
ADD CONSTRAINT "StickerLedger_redemptionId_fkey"
FOREIGN KEY ("redemptionId") REFERENCES "LoyaltyRedemption"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoyaltyReward"
ADD CONSTRAINT "LoyaltyReward_rewardBookId_fkey"
FOREIGN KEY ("rewardBookId") REFERENCES "Book"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoyaltyRedemption"
ADD CONSTRAINT "LoyaltyRedemption_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoyaltyRedemption"
ADD CONSTRAINT "LoyaltyRedemption_rewardId_fkey"
FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoyaltyRedemption"
ADD CONSTRAINT "LoyaltyRedemption_generatedPromoId_fkey"
FOREIGN KEY ("generatedPromoId") REFERENCES "PromotionCode"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoyaltyRedemption"
ADD CONSTRAINT "LoyaltyRedemption_grantedBookId_fkey"
FOREIGN KEY ("grantedBookId") REFERENCES "Book"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
