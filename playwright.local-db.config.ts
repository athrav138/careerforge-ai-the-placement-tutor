import { defineConfig } from '@playwright/test';

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl || !directUrl) {
  throw new Error('Local transaction verification requires explicit DATABASE_URL and DIRECT_URL values.');
}

const database = new URL(databaseUrl);
const direct = new URL(directUrl);
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
if (
  !loopbackHosts.has(database.hostname)
  || !loopbackHosts.has(direct.hostname)
  || database.pathname !== '/careerforge_action_txn_test'
  || direct.pathname !== '/careerforge_action_txn_test'
) {
  throw new Error('Local transaction tests are restricted to the disposable loopback database careerforge_action_txn_test.');
}

export default defineConfig({
  testDir: './tests/local',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
});
