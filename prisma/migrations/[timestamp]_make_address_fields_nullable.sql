-- AlterTable
ALTER TABLE "Claim" ADD COLUMN "street" TEXT;
ALTER TABLE "Claim" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Claim" ADD COLUMN "city" TEXT;
ALTER TABLE "Claim" ADD COLUMN "notificationAcknowledged" BOOLEAN NOT NULL DEFAULT false;

-- Update existing records
UPDATE "Claim" SET 
  "street" = "address",
  "postalCode" = '',
  "city" = ''
WHERE "address" IS NOT NULL;

-- You may choose to drop the old address column if you no longer need it
-- ALTER TABLE "Claim" DROP COLUMN "address";