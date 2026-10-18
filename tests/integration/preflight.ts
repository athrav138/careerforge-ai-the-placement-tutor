import { PrismaClient } from '@prisma/client';
import { verifyIntegrationTarget } from './preflight-check';

/** Verify reachability before Playwright starts any integration test body. */
export default async function integrationPreflight() {
  const prisma = new PrismaClient();
  try {
    const authBaseUrl = process.env.PLAYWRIGHT_AUTH_INTEGRATION === 'true'
      ? process.env.NEON_AUTH_BASE_URL
      : undefined;
    await verifyIntegrationTarget({
      readDatabaseName: async () => {
        const databases = await prisma.$queryRaw<Array<{ database_name: string }>>`
          SELECT current_database() AS database_name
        `;
        if (databases.length !== 1) throw new Error('Unexpected database identity.');
        return databases[0].database_name;
      },
      authBaseUrl,
    });
  } finally {
    await prisma.$disconnect();
  }
}
