ALTER TABLE "AuthorBlog"
ADD COLUMN "scheduledAt" TIMESTAMP(3);

CREATE INDEX "AuthorBlog_scheduledAt_idx" ON "AuthorBlog"("scheduledAt");

