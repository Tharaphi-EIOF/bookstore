CREATE TABLE "PricingSetting" (
  "id" TEXT NOT NULL,
  "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
  "vendorMarkupType" "PromotionDiscountType" NOT NULL DEFAULT 'PERCENT',
  "vendorMarkupValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "applyPricingOnReceive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PricingSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PricingSetting" ("id", "taxRate", "vendorMarkupType", "vendorMarkupValue", "applyPricingOnReceive", "updatedAt")
VALUES ('global', 10, 'PERCENT', 0, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
