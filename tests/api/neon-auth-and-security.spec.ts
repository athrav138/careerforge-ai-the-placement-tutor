import { expect, test } from '@playwright/test';

const enabled = process.env.PLAYWRIGHT_AUTH_INTEGRATION === 'true';

test.describe('Neon Auth API integration validation', () => {
  test.skip(
    !enabled,
    'Requires PLAYWRIGHT_AUTH_INTEGRATION=true and an isolated, non-production Neon Auth test branch.',
  );

  test('rejects sign-up with missing credentials', async ({ request }) => {
    const response = await request.post('/api/auth/sign-up/email', {
      data: { name: 'Invalid Test', email: '', password: '' },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toBeTruthy();
  });

  test('rejects malformed sign-up payload without creating an account', async ({ request }) => {
    const response = await request.post('/api/auth/sign-up/email', {
      data: { email: 'invalid-email', password: 'short' },
    });
    expect(response.status()).toBe(400);
  });

  test('rejects invalid credentials with a client error', async ({ request }) => {
    const response = await request.post('/api/auth/sign-in/email', {
      data: { email: 'nobody@example.invalid', password: 'not-a-valid-test-password' },
    });
    expect([400, 401, 403]).toContain(response.status());
    expect(await response.json()).toBeTruthy();
  });

  test('rejects an invalid password reset token', async ({ request }) => {
    const response = await request.post('/api/auth/reset-password', {
      data: { token: 'invalid-or-expired-token', newPassword: 'NewSecurePassword123!' },
    });
    expect([400, 401, 403]).toContain(response.status());
  });
});
