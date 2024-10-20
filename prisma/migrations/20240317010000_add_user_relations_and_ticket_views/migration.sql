-- AlterTable
ALTER TABLE "Claim" ADD COLUMN "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Return" ADD COLUMN "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TicketView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketView_userId_ticketId_key" ON "TicketView"("userId", "ticketId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketView" ADD CONSTRAINT "TicketView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketView" ADD CONSTRAINT "TicketView_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update existing Claim records
UPDATE "Claim"
SET "userId" = (SELECT "id" FROM "User" WHERE "isAdmin" = true LIMIT 1)
WHERE "userId" IS NULL;

-- Update existing Return records
UPDATE "Return"
SET "userId" = (SELECT "id" FROM "User" WHERE "isAdmin" = true LIMIT 1)
WHERE "userId" IS NULL;
