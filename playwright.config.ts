import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100';
const base = new URL(baseURL);
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

if (!loopbackHosts.has(base.hostname) || base.pathname !== '/') {
  throw new Error('Playwright must target a loopback URL at the site root. Remote targets are not allowed.');
}

const authIntegrationEnabled = process.env.PLAYWRIGHT_AUTH_INTEGRATION === 'true';
const databaseIntegrationEnabled = process.env.PLAYWRIGHT_DATABASE_INTEGRATION === 'true';
const integrationEnabled = authIntegrationEnabled || databaseIntegrationEnabled;
const testDatabaseUrl = process.env.PLAYWRIGHT_TEST_DATABASE_URL;
const testDirectUrl = process.env.PLAYWRIGHT_TEST_DIRECT_URL;
const testAuthBaseUrl = process.env.PLAYWRIGHT_TEST_NEON_AUTH_BASE_URL;
const testBranchId = process.env.PLAYWRIGHT_TEST_BRANCH_ID;
const expectedTestBranchId = 'br-shy-hill-b4dsm90r';
const expectedTestEndpointId = 'ep-plain-poetry-b4cy32gr';
const unsanitizedBranchId = 'br-sparkling-lake-axf1jtg1';
const productionEndpointMarker = 'ep-fancy-bread-axzex13s';

function urlHostname(value: string | undefined, variableName: string): string {
  try {
    return new URL(value!).hostname;
  } catch {
    throw new Error(`${variableName} must be a valid URL for the dedicated Neon integration branch.`);
  }
}

if (integrationEnabled) {
  const required: Record<string, string | undefined> = {
    PLAYWRIGHT_TEST_DATABASE_URL: testDatabaseUrl,
    PLAYWRIGHT_TEST_DIRECT_URL: testDirectUrl,
    PLAYWRIGHT_TEST_BRANCH_ID: testBranchId,
  };
  if (authIntegrationEnabled) {
    required.PLAYWRIGHT_TEST_NEON_AUTH_BASE_URL = testAuthBaseUrl;
    required.PLAYWRIGHT_TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;
    required.NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET;
  }
  const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`Playwright integration tests require: ${missing.join(', ')}`);
  }
  if (authIntegrationEnabled && process.env.NEON_AUTH_COOKIE_SECRET!.length < 32) {
    throw new Error('NEON_AUTH_COOKIE_SECRET must contain at least 32 characters for integration tests.');
  }

  if ([testDatabaseUrl, testDirectUrl, testAuthBaseUrl].some((value) => value?.includes(productionEndpointMarker))) {
    throw new Error('The production Neon endpoint cannot be used for Playwright integration tests.');
  }

  const databaseHosts = [
    urlHostname(testDatabaseUrl, 'PLAYWRIGHT_TEST_DATABASE_URL'),
    urlHostname(testDirectUrl, 'PLAYWRIGHT_TEST_DIRECT_URL'),
  ];
  if (databaseHosts.some((hostname) => !hostname.startsWith(`${expectedTestEndpointId}.`) && !hostname.startsWith(`${expectedTestEndpointId}-`))) {
    throw new Error('Playwright database URLs must resolve to the verified isolated CareerForge integration-test endpoint.');
  }

  if (authIntegrationEnabled) {
    const authUrl = new URL(testAuthBaseUrl!);
    if (
      authUrl.protocol !== 'https:'
      || !authUrl.hostname.startsWith(`${expectedTestEndpointId}.neonauth.`)
      || authUrl.pathname.replace(/\/$/, '') !== '/neondb/auth'
    ) {
      throw new Error('PLAYWRIGHT_TEST_NEON_AUTH_BASE_URL must target Neon Auth on the verified isolated integration project.');
    }
  }

  if (testBranchId === unsanitizedBranchId) {
    throw new Error('The configured integration branch contains production-derived application records and is not approved for tests.');
  }

  if (testBranchId !== expectedTestBranchId) {
    throw new Error('Playwright integration tests require the verified isolated CareerForge integration-test branch.');
  }
}

const unavailableDatabaseUrl = 'postgresql://playwright:playwright@127.0.0.1:9/careerforge_test?sslmode=disable';
const authBaseUrl = authIntegrationEnabled ? testAuthBaseUrl! : 'http://127.0.0.1:9/neondb/auth';
const port = base.port || '3100';
const browserChannel = process.env.PLAYWRIGHT_CHANNEL
  ?? (process.platform === 'win32' ? 'msedge' : undefined);

if (browserChannel && browserChannel !== 'chrome' && browserChannel !== 'msedge') {
  throw new Error('PLAYWRIGHT_CHANNEL must be either chrome or msedge.');
}

const browserUse = {
  ...devices['Desktop Chrome'],
  ...(browserChannel ? { channel: browserChannel as 'chrome' | 'msedge' } : {}),
};

process.env.DATABASE_URL = integrationEnabled ? testDatabaseUrl! : unavailableDatabaseUrl;
process.env.DIRECT_URL = integrationEnabled ? testDirectUrl! : unavailableDatabaseUrl;
process.env.NEON_AUTH_BASE_URL = authBaseUrl;

export default defineConfig({
  globalSetup: integrationEnabled ? './tests/integration/preflight.ts' : undefined,
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: browserChannel ?? 'chromium', use: browserUse }],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true' ? undefined : {
    command: `node ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGINT', timeout: 5_000 },
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      DIRECT_URL: process.env.DIRECT_URL!,
      NEON_AUTH_BASE_URL: authBaseUrl,
      NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET ?? 'playwright-only-cookie-secret-not-for-deployment',
      PLAYWRIGHT_AUTH_INTEGRATION: process.env.PLAYWRIGHT_AUTH_INTEGRATION ?? 'false',
      NEXT_PUBLIC_SITE_URL: baseURL,
      GEMINI_API_KEY: 'playwright-offline-placeholder',
      SESSION_SECRET: 'playwright-only-session-secret-not-for-deployment',
    },
  },
});
