-- AlterTable
ALTER TABLE "Claim" 
ADD COLUMN IF NOT EXISTS "street" TEXT,
ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "notificationAcknowledged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notification" TEXT NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Brand_name_key" ON "Brand"("name");

-- Update existing records (if the address column still exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Claim' AND column_name = 'address') THEN
        UPDATE "Claim" SET 
            "street" = "address",
            "postalCode" = '',
            "city" = ''
        WHERE "address" IS NOT NULL AND "street" IS NULL;
        
        ALTER TABLE "Claim" DROP COLUMN IF EXISTS "address";
    END IF;
END $$;