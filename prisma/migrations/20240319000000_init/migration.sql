// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Claim {
  id                      String   @id @default(uuid())
  orderNumber             String   @unique
  email                   String
  name                    String
  street                  String?
  postalCode              String?
  city                    String?
  phoneNumber             String
  brand                   String
  problemDescription      String
  status                  String
  submissionDate          DateTime @default(now())
  notificationAcknowledged Boolean  @default(false)
  userId                  String
  user                    User     @relation(fields: [userId], references: [id])
}

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String
  isAdmin         Boolean   @default(false)
  isEmailVerified Boolean   @default(false)
  verificationToken String?
  resetToken      String?
  resetTokenExpiry DateTime?
  tickets         Ticket[]
  claims          Claim[]
  returns         Return[]
  ticketViews     TicketView[]
}

model Brand {
  id            String              @id @default(uuid())
  name          String              @unique
  notification  String
  notifications BrandNotification[]
}

model BrandNotification {
  id        String @id @default(uuid())
  brandId   String
  language  String
  content   String
  brand     Brand  @relation(fields: [brandId], references: [id])
  @@unique([brandId, language])
}

model Return {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  email           String
  reason          String
  description     String
  status          String
  submissionDate  DateTime @default(now())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
}

model FAQ {
  id       String @id @default(uuid())
  question String
  answer   String
  language String
  @@unique([question, language])
}

model Ticket {
  id          String    @id @default(uuid())
  orderNumber String
  subject     String
  status      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  messages    Message[]
  views       TicketView[]

  @@unique([orderNumber, userId])
}

model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  isAdminReply Boolean
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
}

model TicketView {
  id        String   @id @default(uuid())
  userId    String
  ticketId  String
  viewedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  ticket    Ticket   @relation(fields: [ticketId], references: [id])

  @@unique([userId, ticketId])
}
