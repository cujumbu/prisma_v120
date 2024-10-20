-- Create User table if it doesn't exist
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3)
);

-- Create Claim table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT
);

-- Create Return table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Return" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT
);

-- Create TicketView table
CREATE TABLE IF NOT EXISTS "TicketView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Alter Claim table
ALTER TABLE "Claim" 
ALTER COLUMN "userId" SET NOT NULL;

-- Alter Return table
ALTER TABLE "Return" 
ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Claim" 
ADD CONSTRAINT "Claim_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Return" 
ADD CONSTRAINT "Return_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketView" 
ADD CONSTRAINT "TicketView_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketView" 
ADD CONSTRAINT "TicketView_ticketId_fkey" 
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create unique index on TicketView
CREATE UNIQUE INDEX IF NOT EXISTS "TicketView_userId_ticketId_key" ON "TicketView"("userId", "ticketId");
