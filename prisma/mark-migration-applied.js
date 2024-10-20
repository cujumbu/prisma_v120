import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markMigrationAsApplied() {
  try {
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        '20240323000000_baseline',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        NOW(),
        '20240323000000_baseline',
        'Marked as applied manually',
        NULL,
        NOW(),
        1
      )
      ON CONFLICT (id) DO UPDATE SET
        finished_at = EXCLUDED.finished_at,
        logs = EXCLUDED.logs,
        rolled_back_at = EXCLUDED.rolled_back_at,
        applied_steps_count = EXCLUDED.applied_steps_count;
    `;
    console.log('Baseline migration marked as applied successfully');
  } catch (error) {
    console.error('Error marking baseline migration as applied:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markMigrationAsApplied();
