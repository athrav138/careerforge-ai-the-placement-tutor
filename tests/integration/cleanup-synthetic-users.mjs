import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const cleanupFile = join(process.cwd(), 'test-results', 'neon-auth-cleanup.json');
const expectedBranchId = 'br-shy-hill-b4dsm90r';
const expectedEndpointId = 'ep-plain-poetry-b4cy32gr';
const emails = JSON.parse(readFileSync(cleanupFile, 'utf8'));

async function main() {
  if (!Array.isArray(emails) || emails.some((email) => (
    typeof email !== 'string'
    || !/^careerforge-(?:(?:integration|session)-[0-9a-f-]+@example\.invalid|diagnostic-[0-9a-f-]+@example\.com)$/.test(email)
  ))) {
    throw new Error('Cleanup list contains an identity outside the generated synthetic format.');
  }
  if (process.env.PLAYWRIGHT_TEST_BRANCH_ID !== expectedBranchId) {
    throw new Error('Cleanup target branch is not the approved integration-test branch.');
  }
  const directUrl = new URL(process.env.DIRECT_URL ?? '');
  if (directUrl.hostname !== `${expectedEndpointId}.c-6.us-east-2.aws.neon.tech` || directUrl.pathname !== '/neondb') {
    throw new Error('Cleanup database is not the approved integration-test project.');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.deleteMany({ where: { email: { in: emails } } });
      for (const email of emails) {
        await transaction.$executeRaw`DELETE FROM neon_auth."user" WHERE email = ${email}`;
      }
    });

    const appUserCount = await prisma.user.count({ where: { email: { in: emails } } });
    let authUserCount = 0;
    for (const email of emails) {
      const [authUsers] = await prisma.$queryRaw`
        SELECT count(*)::int AS count
        FROM neon_auth."user"
        WHERE email = ${email}
      `;
      authUserCount += authUsers.count;
    }
    if (appUserCount !== 0 || authUserCount !== 0) {
      throw new Error('Generated test identities remain after cleanup.');
    }
    unlinkSync(cleanupFile);
    console.log(`Removed and verified cleanup of ${emails.length} identities created by this run.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const safeError = error && typeof error === 'object'
    ? {
      name: typeof error.name === 'string' ? error.name : 'Error',
      code: typeof error.code === 'string' ? error.code : undefined,
      prismaCode: typeof error.errorCode === 'string' ? error.errorCode : undefined,
    }
    : { name: 'Error' };
  console.error('Synthetic identity cleanup failed; safe error details:', safeError);
  console.error('The exact per-run cleanup list was retained for investigation.');
  process.exitCode = 1;
});
