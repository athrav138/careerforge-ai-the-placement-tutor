import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const expectedBranchId = 'br-shy-hill-b4dsm90r';
const expectedEndpointId = 'ep-plain-poetry-b4cy32gr';
const productionEndpointId = 'ep-fancy-bread-axzex13s';
const email = `careerforge-diagnostic-${randomUUID()}@example.com`;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
const baseUrl = process.env.NEON_AUTH_BASE_URL;

function validateTarget() {
  if (process.env.PLAYWRIGHT_TEST_BRANCH_ID !== expectedBranchId || !password || !baseUrl) {
    throw new Error('The approved integration branch, Auth URL, and test-only password are required.');
  }
  const auth = new URL(baseUrl);
  if (
    auth.protocol !== 'https:'
    || auth.hostname !== `${expectedEndpointId}.neonauth.c-6.us-east-2.aws.neon.tech`
    || auth.pathname.replace(/\/$/, '') !== '/neondb/auth'
    || auth.href.includes(productionEndpointId)
  ) {
    throw new Error('The Auth URL does not match the approved isolated integration project.');
  }
}

function recordForCleanup() {
  const cleanupFile = join(process.cwd(), 'test-results', 'neon-auth-cleanup.json');
  mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
  writeFileSync(cleanupFile, JSON.stringify([email]), { encoding: 'utf8', mode: 0o600 });
}

function safeResponseBody(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { bodyType: 'non-json', bodyLength: raw.length };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { bodyType: typeof parsed };
  }

  const safe = {};
  for (const key of ['code', 'error', 'message']) {
    if (typeof parsed[key] === 'string') {
      safe[key] = parsed[key]
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
        .replace(/\b(?:eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+)\b/g, '[REDACTED_TOKEN]')
        .slice(0, 300);
    }
  }
  return Object.keys(safe).length ? safe : { bodyType: 'json', keys: Object.keys(parsed).slice(0, 20) };
}

async function main() {
  validateTarget();
  recordForCleanup();

  const endpoint = new URL(`${baseUrl}/sign-up/email`);
  let response;
  let raw;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3100',
        'x-neon-auth-proxy': 'nextjs',
      },
      body: JSON.stringify({
        email,
        password,
        name: 'CareerForge diagnostic identity',
        callbackURL: '/dashboard',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    raw = await response.text();
  } catch (error) {
    console.log(JSON.stringify({
      timestampUtc: new Date().toISOString(),
      project: 'CareerForge-AI-integration-test',
      branchId: expectedBranchId,
      method: 'POST',
      path: '/neondb/auth/sign-up/email',
      transportErrorType: error instanceof Error ? error.name : 'UnknownError',
    }));
    return;
  }

  console.log(JSON.stringify({
    timestampUtc: new Date().toISOString(),
    project: 'CareerForge-AI-integration-test',
    branchId: expectedBranchId,
    method: 'POST',
    path: '/neondb/auth/sign-up/email',
    status: response.status,
    statusText: response.statusText,
    responseBody: safeResponseBody(raw),
  }));
}

main().catch(() => {
  console.error('The guarded Neon Auth signup diagnostic could not be prepared. No response details or credentials were printed.');
  process.exitCode = 1;
});
