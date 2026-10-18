import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const enabled = process.env.PLAYWRIGHT_AUTH_INTEGRATION === 'true';
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
const expectedTestBranchId = 'br-shy-hill-b4dsm90r';
const createdEmails = new Set<string>();
const cleanupEmailPattern = /^careerforge-(?:integration|session)-[0-9a-f-]+@example\.invalid$/;

function queueCleanupEmails(emails: string[]) {
  if (emails.some((email) => !cleanupEmailPattern.test(email))) {
    throw new Error('Refusing to queue cleanup because a test email is outside the generated synthetic identity pattern.');
  }
  if (process.env.PLAYWRIGHT_TEST_BRANCH_ID !== expectedTestBranchId) {
    throw new Error('Refusing to queue cleanup because the verified test database identity is unavailable.');
  }

  const cleanupFile = join(process.cwd(), 'test-results', 'neon-auth-cleanup.json');
  mkdirSync(dirname(cleanupFile), { recursive: true });
  let pending: string[] = [];
  if (existsSync(cleanupFile)) {
    const existing = JSON.parse(readFileSync(cleanupFile, 'utf8')) as unknown;
    if (!Array.isArray(existing) || existing.some((email) => typeof email !== 'string' || !cleanupEmailPattern.test(email))) {
      throw new Error('Refusing to replace an invalid or unexpected synthetic cleanup list.');
    }
    pending = existing;
  }

  const merged = [...new Set([...pending, ...emails])];
  const temporaryFile = `${cleanupFile}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(merged), { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryFile, cleanupFile);
}

async function register(page: Page, email: string, password: string) {
  createdEmails.add(email);
  queueCleanupEmails([email]);
  await page.goto('/register');
  await page.locator('input[name="name"]').fill('CareerForge Integration User');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: /^create account$/i }).click();

  const accountCreatedStatus = page.getByRole('status').filter({ hasText: /account was created/i });
  const populatedAlert = page.getByRole('alert').filter({ hasText: /\S/ });
  const signupOutcome = await Promise.race([
    page.waitForURL(/\/dashboard(?:\/|$)/, { timeout: 10_000 }).then(() => 'dashboard' as const).catch(() => 'timeout' as const),
    accountCreatedStatus.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'created-message' as const).catch(() => 'timeout' as const),
    populatedAlert.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'error' as const).catch(() => 'timeout' as const),
  ]);
  if (signupOutcome === 'error') {
    const visibleError = (await populatedAlert.innerText()).replace(/\s+/g, ' ').trim().slice(0, 240);
    throw new Error(`Registration returned an application error: ${visibleError || 'no safe error text was available'}`);
  }
  if (signupOutcome === 'timeout') {
    throw new Error('Registration neither navigated nor returned an account-created status.');
  }

  if (signupOutcome === 'created-message') {
    await expect(page.getByRole('status')).toContainText(/account was created/i);
    const currentSession = await page.evaluate(async () => {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      return response.status;
    });
    if (currentSession === 200) {
      await page.goto('/dashboard');
    } else {
      await page.goto('/login');
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole('button', { name: /^sign in$/i }).click();
      const loginOutcome = await Promise.race([
        page.waitForURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 }).then(() => 'dashboard' as const).catch(() => 'timeout' as const),
        populatedAlert.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'error' as const).catch(() => 'timeout' as const),
      ]);
      if (loginOutcome === 'error') {
        const visibleError = (await populatedAlert.innerText()).replace(/\s+/g, ' ').trim().slice(0, 240);
        throw new Error(`Account creation succeeded, but follow-up sign-in failed: ${visibleError}`);
      }
      if (loginOutcome === 'timeout') {
        throw new Error('Account creation succeeded, but follow-up sign-in neither navigated nor showed an error.');
      }
    }
  }

  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
}

async function readAuthIdentity(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/auth/me', { cache: 'no-store' });
    return { status: response.status, body: await response.json() };
  });
}

async function expectSignedOut(page: Page) {
  const [auth, profile] = await Promise.all([
    readAuthIdentity(page),
    page.evaluate(async () => {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      return { status: response.status, body: await response.json() };
    }),
  ]);
  expect(auth.status).toBe(401);
  expect(auth.body.user).toBeNull();
  expect(profile.status).toBe(401);
}

test.describe('Neon Auth integration', () => {
  test.skip(!enabled, 'Requires an explicitly configured isolated Neon integration project and test password.');

  test.afterAll(async () => {
    const emails = [...createdEmails];
    if (!enabled || emails.length === 0) return;
    queueCleanupEmails(emails);
  });

  test('disposable account can register, persist a profile, use protected APIs, and sign out', async ({ page }) => {
    if (!password) {
      throw new Error('PLAYWRIGHT_TEST_PASSWORD must be configured for auth integration tests.');
    }

    const firstUserEmail = `careerforge-integration-${randomUUID()}@example.invalid`;
    await register(page, firstUserEmail, password);
    if (process.env.PLAYWRIGHT_AUTH_DIAGNOSTIC === 'true') {
      await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
      return;
    }

    // Stop the dashboard's independent summary requests before exercising the
    // profile and authorization APIs, so the integration assertions run serially.
    await page.goto('/');

    const authenticated = await readAuthIdentity(page);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.email).toBe(firstUserEmail);

    const profilePayload = {
      college: 'CareerForge Integration College',
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: '2028',
      cgpa: '8.5',
      skills: 'Integration Testing, PostgreSQL',
      targetRole: 'Integration Test Engineer',
      interests: 'Testing isolated CareerForge flows',
    };
    const savedProfile = await page.evaluate(async (profile) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return { status: response.status, body: await response.json() };
    }, profilePayload);
    expect(savedProfile.status).toBe(200);

    const persistedProfile = await page.evaluate(async () => {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      return { status: response.status, body: await response.json() };
    });
    expect(persistedProfile.status).toBe(200);
    expect(persistedProfile.body.profile.college).toBe(profilePayload.college);
    expect(persistedProfile.body.profile.skills).toBe('integration testing, postgresql');
    expect(persistedProfile.body.profile.targetRole).toBe(profilePayload.targetRole);

    const duplicateSignup = await page.evaluate(async ({ name, email, password }) => {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      return { status: response.status };
    }, { name: 'CareerForge Integration User', email: firstUserEmail, password });
    expect(duplicateSignup.status).toBeGreaterThanOrEqual(400);
    const afterDuplicate = await readAuthIdentity(page);
    expect(afterDuplicate.status).toBe(200);
    expect(afterDuplicate.body.user.email).toBe(firstUserEmail);
    const profileAfterDuplicate = await page.evaluate(async () => {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      return { status: response.status, body: await response.json() };
    });
    expect(profileAfterDuplicate.status).toBe(200);
    expect(profileAfterDuplicate.body.profile.college).toBe(profilePayload.college);

    const generatedActions = await page.evaluate(async () => {
      const response = await fetch('/api/action-center', { method: 'POST' });
      return { status: response.status, body: await response.json() };
    });
    expect(generatedActions.status).toBe(200);
    expect(generatedActions.body.actions.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/$/);

    const signedOutProfile = await page.evaluate(async () => {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      return { status: response.status, body: await response.json() };
    });
    expect(signedOutProfile.status).toBe(401);
    expect(signedOutProfile.body.error).toBeTruthy();

    const secondUserEmail = `careerforge-integration-${randomUUID()}@example.invalid`;
    await register(page, secondUserEmail, password);

    const crossUserAction = await page.evaluate(async (actionId) => {
      const response = await fetch(`/api/action-center/${actionId}/complete`, { method: 'POST' });
      return { status: response.status, body: await response.json() };
    }, generatedActions.body.actions[0].id);
    expect(crossUserAction.status).toBe(403);

    const secondUserActions = await page.evaluate(async () => {
      const response = await fetch('/api/action-center', { cache: 'no-store' });
      return { status: response.status, body: await response.json() };
    });
    expect(secondUserActions.status).toBe(200);
    expect(secondUserActions.body.actions.some((action: { id: string }) => action.id === generatedActions.body.actions[0].id)).toBe(false);

    const crossUserDelete = await page.evaluate(async (actionId) => {
      const response = await fetch(`/api/action-center/${actionId}`, { method: 'DELETE' });
      return { status: response.status };
    }, generatedActions.body.actions[0].id);
    expect(crossUserDelete.status).toBe(403);

    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('registered identity restores a persisted session and logout invalidates protected access', async ({ page, browser }) => {
    if (!password) {
      throw new Error('PLAYWRIGHT_TEST_PASSWORD must be configured for auth integration tests.');
    }

    const testEmail = `careerforge-session-${randomUUID()}@example.invalid`;
    await register(page, testEmail, password);

    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    const authenticated = await readAuthIdentity(page);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.email).toBe(testEmail);

    await page.reload();
    await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();

    const storageState = await page.context().storageState();
    const restoredContext = await browser.newContext({ storageState });
    try {
      const restoredPage = await restoredContext.newPage();
      await restoredPage.goto('/dashboard');
      await expect(restoredPage).toHaveURL(/\/dashboard(?:\/|$)/);
      await expect(restoredPage.getByRole('button', { name: /logout/i })).toBeVisible();
      const restoredIdentity = await readAuthIdentity(restoredPage);
      expect(restoredIdentity.status).toBe(200);
      expect(restoredIdentity.body.user.email).toBe(testEmail);

      await restoredPage.getByRole('button', { name: /logout/i }).click();
      await expect(restoredPage).toHaveURL(/\/$/);
      await expectSignedOut(restoredPage);
    } finally {
      await restoredContext.close();
    }

    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expectSignedOut(page);
  });
});
