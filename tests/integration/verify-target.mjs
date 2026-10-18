import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const projectRoot = process.cwd();
const migrationsRoot = join(projectRoot, 'prisma', 'migrations');
const expectedBranchId = 'br-shy-hill-b4dsm90r';
const expectedEndpointId = 'ep-plain-poetry-b4cy32gr';
const productionEndpointId = 'ep-fancy-bread-axzex13s';
const stage = process.argv[2] ?? 'before';

function requireTargetEnvironment() {
  if (process.env.PLAYWRIGHT_TEST_BRANCH_ID !== expectedBranchId) {
    throw new Error('The configured branch is not the approved integration-test branch.');
  }

  const direct = new URL(process.env.DIRECT_URL ?? '');
  const pooled = new URL(process.env.DATABASE_URL ?? '');
  const auth = new URL(process.env.NEON_AUTH_BASE_URL ?? '');
  if (
    direct.hostname !== `${expectedEndpointId}.c-6.us-east-2.aws.neon.tech`
    || pooled.hostname !== `${expectedEndpointId}-pooler.c-6.us-east-2.aws.neon.tech`
    || auth.hostname !== `${expectedEndpointId}.neonauth.c-6.us-east-2.aws.neon.tech`
    || direct.pathname !== '/neondb'
    || pooled.pathname !== '/neondb'
    || auth.pathname.replace(/\/$/, '') !== '/neondb/auth'
    || direct.protocol !== 'postgresql:'
    || pooled.protocol !== 'postgresql:'
    || auth.protocol !== 'https:'
  ) {
    throw new Error('The database or Auth endpoint does not match the approved integration project.');
  }

  if ([direct.href, pooled.href, auth.href].some((value) => value.includes(productionEndpointId))) {
    throw new Error('Production endpoints are forbidden for integration operations.');
  }
  if (process.env.NEON_AUTH_COOKIE_SECRET?.length < 32) {
    throw new Error('A private test-only Auth cookie secret of at least 32 characters is required.');
  }
  if ((process.env.PLAYWRIGHT_TEST_PASSWORD?.length ?? 0) < 8) {
    throw new Error('A private test-only password of at least 8 characters is required.');
  }
}

function expectedMigrations() {
  return readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const name = entry.name;
      const sqlPath = join(migrationsRoot, name, 'migration.sql');
      return { name, checksum: createHash('sha256').update(readFileSync(sqlPath)).digest('hex') };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function assertMigrationHistory(records, expected) {
  if (records.length !== expected.length) throw new Error('The applied migration count does not match the repository.');
  const byName = new Map(records.map((record) => [record.migration_name, record]));
  for (const migration of expected) {
    const record = byName.get(migration.name);
    if (!record || !record.finished_at || record.rolled_back_at || record.checksum !== migration.checksum) {
      throw new Error('Prisma migration history is incomplete or differs from the checked-in migration files.');
    }
  }
}

async function main() {
  requireTargetEnvironment();
  const authResponse = await fetch(`${process.env.NEON_AUTH_BASE_URL}/reference`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!authResponse.ok) throw new Error('The approved Neon Auth endpoint did not pass its read-only probe.');

  const prisma = new PrismaClient();
  try {
    const [identity] = await prisma.$queryRaw`
      SELECT current_database() AS database_name,
             current_setting('server_version') AS postgres_version,
             to_regclass('public."_prisma_migrations"') IS NOT NULL AS has_migration_history,
             to_regclass('public."User"') IS NOT NULL AS has_user_table,
             (SELECT count(*)::int FROM information_schema.tables
              WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                AND table_name <> '_prisma_migrations') AS public_table_count,
             (SELECT count(*)::int FROM neon_auth."user") AS auth_user_count,
             (SELECT count(*)::int FROM neon_auth.session) AS auth_session_count,
             (SELECT count(*)::int FROM neon_auth.account) AS auth_account_count
    `;
    if (identity.database_name !== 'neondb' || !identity.postgres_version.startsWith('18.')) {
      throw new Error('The target database identity or PostgreSQL version does not match the approved test environment.');
    }

    const expected = expectedMigrations();
    if (expected.length !== 16) throw new Error('Expected 16 checked-in Prisma migrations.');
    let applicationUserCount = 0;
    if (identity.has_user_table) {
      const [applicationUsers] = await prisma.$queryRaw`SELECT count(*)::int AS count FROM public."User"`;
      applicationUserCount = applicationUsers.count;
    }

    if (stage === 'before') {
      if (!identity.has_migration_history && identity.public_table_count !== 0) {
        throw new Error('Refusing to migrate: public application tables exist without Prisma migration history.');
      }
      if (identity.has_migration_history) {
        const records = await prisma.$queryRaw`
          SELECT migration_name, checksum, finished_at, rolled_back_at
          FROM public."_prisma_migrations"
        `;
        assertMigrationHistory(records, expected);
      }
      if (identity.auth_user_count !== 0 || identity.auth_session_count !== 0 || identity.auth_account_count !== 0) {
        throw new Error('Refusing to start: the isolated Auth test target contains prior identities or sessions.');
      }
      if (applicationUserCount !== 0) {
        throw new Error('Refusing to start: the isolated application schema contains prior users.');
      }
      console.log(`Preflight passed: ${identity.database_name}, PostgreSQL ${identity.postgres_version}, ${expected.length} repository migrations.`);
      return;
    }

    const records = await prisma.$queryRaw`
      SELECT migration_name, checksum, finished_at, rolled_back_at
      FROM public."_prisma_migrations"
    `;
    assertMigrationHistory(records, expected);

    if (stage === 'after-test') {
      const [counts] = await prisma.$queryRaw`
        SELECT (SELECT count(*)::int FROM public."User") AS application_user_count,
               (SELECT count(*)::int FROM neon_auth."user") AS auth_user_count,
               (SELECT count(*)::int FROM neon_auth.session) AS auth_session_count,
               (SELECT count(*)::int FROM neon_auth.account) AS auth_account_count
      `;
      if (Object.values(counts).some((count) => Number(count) !== 0)) {
        throw new Error('Synthetic account cleanup did not leave the disposable test target empty.');
      }
      console.log(`Post-test cleanup verified: ${records.length} migrations remain; synthetic account and profile tables are empty.`);
      return;
    }

    console.log(`Migration history verified: ${records.length} successful migrations match checked-in checksums.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(`Isolated Neon target verification failed at stage "${stage}". Details are suppressed to avoid printing connection data.`);
  process.exitCode = 1;
});
