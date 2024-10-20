-- Drop existing tables if they exist
DROP TABLE IF EXISTS "TicketView";
DROP TABLE IF EXISTS "Message";
DROP TABLE IF EXISTS "Ticket";
DROP TABLE IF EXISTS "FAQ";
DROP TABLE IF EXISTS "Return";
DROP TABLE IF EXISTS "BrandNotification";
DROP TABLE IF EXISTS "Brand";
DROP TABLE IF EXISTS "Claim";
DROP TABLE IF EXISTS "User";

-- Create User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3)
);

-- Create Claim table
CREATE TABLE "Claim" (
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
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create Brand table
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "notification" TEXT NOT NULL
);

-- Create BrandNotification table
CREATE TABLE "BrandNotification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE,
    UNIQUE ("brandId", "language")
);

-- Create Return table
CREATE TABLE "Return" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create FAQ table
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    UNIQUE ("question", "language")
);

-- Create Ticket table
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE ("orderNumber", "userId")
);

-- Create Message table
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdminReply" BOOLEAN NOT NULL,
    "ticketId" TEXT NOT NULL,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

-- Create TicketView table
CREATE TABLE "TicketView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE,
    UNIQUE ("userId", "ticketId")
);
