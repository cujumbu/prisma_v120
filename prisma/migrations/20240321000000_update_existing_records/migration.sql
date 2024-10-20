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

-- Now make the userId column required
ALTER TABLE "Claim" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Return" ALTER COLUMN "userId" SET NOT NULL;
