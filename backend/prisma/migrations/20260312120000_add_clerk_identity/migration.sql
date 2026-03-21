ALTER TABLE "User"
ADD COLUMN "clerkUserId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE INDEX "User_clerkUserId_idx" ON "User"("clerkUserId");
