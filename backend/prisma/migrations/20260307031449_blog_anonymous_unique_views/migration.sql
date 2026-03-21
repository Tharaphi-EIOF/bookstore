-- CreateTable
CREATE TABLE "BlogPostView" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostAnonymousView" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPostAnonymousView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogPostView_postId_idx" ON "BlogPostView"("postId");

-- CreateIndex
CREATE INDEX "BlogPostView_userId_idx" ON "BlogPostView"("userId");

-- CreateIndex
CREATE INDEX "BlogPostView_createdAt_idx" ON "BlogPostView"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostView_postId_userId_key" ON "BlogPostView"("postId", "userId");

-- CreateIndex
CREATE INDEX "BlogPostAnonymousView_postId_idx" ON "BlogPostAnonymousView"("postId");

-- CreateIndex
CREATE INDEX "BlogPostAnonymousView_visitorId_idx" ON "BlogPostAnonymousView"("visitorId");

-- CreateIndex
CREATE INDEX "BlogPostAnonymousView_createdAt_idx" ON "BlogPostAnonymousView"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostAnonymousView_postId_visitorId_key" ON "BlogPostAnonymousView"("postId", "visitorId");

-- AddForeignKey
ALTER TABLE "BlogPostView" ADD CONSTRAINT "BlogPostView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostView" ADD CONSTRAINT "BlogPostView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostAnonymousView" ADD CONSTRAINT "BlogPostAnonymousView_postId_fkey" FOREIGN KEY ("postId") REFERENCES "AuthorBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
