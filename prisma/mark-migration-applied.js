import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markMigrationAsApplied() {
  try {
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        '20240316160000',
        'e3b0c44298fc1c',
        NOW(),
        '20240316160000_reset_and_apply_all_changes',
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
    console.log('Migration marked as applied successfully');
  } catch (error) {
    console.error('Error marking migration as applied:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markMigrationAsApplied();