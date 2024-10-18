-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(tbl text) RETURNS boolean AS $$
DECLARE
  exists boolean;
BEGIN
  SELECT count(*) > 0 INTO exists
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = tbl;
  RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Create _prisma_migrations table if it doesn't exist
DO $$ BEGIN
  IF NOT table_exists('_prisma_migrations') THEN
    CREATE TABLE "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMP WITH TIME ZONE,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMP WITH TIME ZONE,
      "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  END IF;
END $$;

-- Create User table if it doesn't exist
DO $$ BEGIN
  IF NOT table_exists('User') THEN
    CREATE TABLE "User" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "isAdmin" BOOLEAN NOT NULL DEFAULT false
    );
  END IF;
END $$;

-- Create Claim table if it doesn't exist
DO $$ BEGIN
  IF NOT table_exists('Claim') THEN
    CREATE TABLE "Claim" (
      "id" TEXT PRIMARY KEY,
      "orderNumber" TEXT UNIQUE NOT NULL,
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
      "notificationAcknowledged" BOOLEAN NOT NULL DEFAULT false
    );
  ELSE
    -- Add new columns if they don't exist
    DO $$ BEGIN
      ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "street" TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
    
    DO $$ BEGIN
      ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
    
    DO $$ BEGIN
      ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "city" TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
    
    DO $$ BEGIN
      ALTER TABLE "Claim" ADD COLUMN IF NOT EXISTS "notificationAcknowledged" BOOLEAN NOT NULL DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  END IF;
END $$;

-- Create Brand table if it doesn't exist
DO $$ BEGIN
  IF NOT table_exists('Brand') THEN
    CREATE TABLE "Brand" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT UNIQUE NOT NULL,
      "notification" TEXT NOT NULL
    );
  END IF;
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS table_exists(text);