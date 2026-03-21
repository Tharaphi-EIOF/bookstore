ALTER TABLE "BookLead"
ADD COLUMN "procurementIsbn" TEXT,
ADD COLUMN "procurementPrice" DECIMAL(10,2),
ADD COLUMN "procurementCategories" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "procurementGenres" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
ADD COLUMN "procurementDescription" TEXT,
ADD COLUMN "procurementCoverImage" TEXT,
ADD COLUMN "procurementStock" INTEGER,
ADD COLUMN "procurementWarehouseId" TEXT,
ADD COLUMN "procurementQuantity" INTEGER,
ADD COLUMN "procurementEstimatedCost" DECIMAL(10,2),
ADD COLUMN "procurementReviewNote" TEXT;
