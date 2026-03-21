-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BlogPostStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "BlogPostStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "AuthorBlog" ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "AuthorBlog_reviewedByUserId_idx" ON "AuthorBlog"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "AuthorBlog_reviewedAt_idx" ON "AuthorBlog"("reviewedAt");
