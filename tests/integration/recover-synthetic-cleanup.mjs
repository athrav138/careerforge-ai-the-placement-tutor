import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const expectedBranchId = 'br-shy-hill-b4dsm90r';
const expectedEndpointId = 'ep-plain-poetry-b4cy32gr';
const productionEndpointId = 'ep-fancy-bread-axzex13s';
const cleanupFile = join(process.cwd(), 'test-results', 'neon-auth-cleanup.json');
const syntheticEmail = /^careerforge-(?:(?:integration|session)-[0-9a-f-]+@example\.invalid|diagnostic-[0-9a-f-]+@example\.com)$/;

async function main() {
  if (process.env.PLAYWRIGHT_TEST_BRANCH_ID !== expectedBranchId) {
    throw new Error('Recovery branch is not the approved integration-test branch.');
  }
  const direct = new URL(process.env.DIRECT_URL ?? '');
  if (
    direct.protocol !== 'postgresql:'
    || direct.hostname !== `${expectedEndpointId}.c-6.us-east-2.aws.neon.tech`
    || direct.pathname !== '/neondb'
    || direct.href.includes(productionEndpointId)
  ) {
    throw new Error('Recovery database is not the approved integration-test target.');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: direct.toString() } } });
  try {
    const [counts] = await prisma.$queryRaw`
      SELECT (SELECT count(*)::int FROM neon_auth."user") AS auth_user_count,
             (SELECT count(*)::int FROM neon_auth."user"
              WHERE email ~ '^careerforge-(integration|session)-[0-9a-f-]+@example\\.invalid$'
                 OR email ~ '^careerforge-diagnostic-[0-9a-f-]+@example\\.com$') AS synthetic_user_count
    `;
    if (Number(counts.auth_user_count) !== Number(counts.synthetic_user_count)) {
      throw new Error('Recovery stopped because the target contains an Auth identity outside the generated synthetic formats.');
    }

    const rows = await prisma.$queryRaw`
      SELECT email FROM neon_auth."user"
      WHERE email ~ '^careerforge-(integration|session)-[0-9a-f-]+@example\\.invalid$'
         OR email ~ '^careerforge-diagnostic-[0-9a-f-]+@example\\.com$'
    `;
    const emails = rows.map(({ email }) => email);
    if (emails.some((email) => !syntheticEmail.test(email))) {
      throw new Error('Recovery stopped because an Auth identity does not match a generated synthetic format.');
    }

    mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
    writeFileSync(cleanupFile, JSON.stringify(emails), { encoding: 'utf8', mode: 0o600 });
    console.log(`Recovered an exact cleanup list for ${emails.length} generated synthetic identity.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error('Synthetic cleanup recovery stopped safely; no identity values or connection details were printed.');
  process.exitCode = 1;
});
