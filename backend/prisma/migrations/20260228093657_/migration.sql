DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Store'
  ) THEN
    ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
    CREATE INDEX IF NOT EXISTS "Store_deletedAt_idx" ON "Store"("deletedAt");
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Vendor'
  ) THEN
    ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
    CREATE INDEX IF NOT EXISTS "Vendor_deletedAt_idx" ON "Vendor"("deletedAt");
  END IF;
END $$;
