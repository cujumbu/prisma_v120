-- Create a temporary admin user if none exists
INSERT INTO "User" (id, email, password, isAdmin)
SELECT gen_random_uuid(), 'temp_admin@example.com', 'temp_password', true
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE isAdmin = true);

-- Get the ID of an admin user
DO $$
DECLARE
    admin_id TEXT;
BEGIN
    SELECT id INTO admin_id FROM "User" WHERE isAdmin = true LIMIT 1;

    -- Update existing Claim records
    UPDATE "Claim" SET "userId" = admin_id WHERE "userId" IS NULL;

    -- Update existing Return records
    UPDATE "Return" SET "userId" = admin_id WHERE "userId" IS NULL;
END $$;

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Claim" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Return" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Return" ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "TicketView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "TicketView_userId_ticketId_key" ON "TicketView"("userId", "ticketId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketView" ADD CONSTRAINT "TicketView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketView" ADD CONSTRAINT "TicketView_ticketId_fkey" FOREIGN KEY ("userId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
