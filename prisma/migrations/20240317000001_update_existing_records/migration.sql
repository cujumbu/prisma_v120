-- Update existing Claim records
UPDATE "Claim"
SET "userId" = (SELECT "id" FROM "User" WHERE "isAdmin" = true LIMIT 1)
WHERE "userId" IS NULL;

-- Update existing Return records
UPDATE "Return"
SET "userId" = (SELECT "id" FROM "User" WHERE "isAdmin" = true LIMIT 1)
WHERE "userId" IS NULL;
