CREATE TABLE "BlogPageSetting" (
  "id" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT 'Treasure House',
  "title" TEXT NOT NULL DEFAULT 'Writing & Poems',
  "introLines" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPageSetting_pkey" PRIMARY KEY ("id")
);
