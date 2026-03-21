ALTER TABLE "BookLead"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "BookLead_deletedAt_idx" ON "BookLead"("deletedAt");
