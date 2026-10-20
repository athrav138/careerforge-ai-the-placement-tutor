import { expect, test } from '@playwright/test';

const protectedRoutes = [
  '/api/profile',
  '/api/career/roles',
  '/api/projects',
  '/api/aptitude/summary',
  '/api/roadmap',
  '/api/readiness',
  '/api/readiness/history',
  '/api/github/profile',
  '/api/linkedin/profile',
];

test.describe('Offline authentication API behavior', () => {
  test('returns no user for an unauthenticated session request', async ({ request }) => {
    const response = await request.get('/api/auth/me');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ user: null });
  });

  test('notification read updates expose the protected PUT contract, not PATCH', async ({ request }) => {
    const response = await request.put('/api/notifications/unauthenticated-test-id');

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'Unauthorized' });

    const unsupportedMethod = await request.patch('/api/notifications/unauthenticated-test-id');
    expect(unsupportedMethod.status()).toBe(405);
  });

  for (const route of protectedRoutes) {
    test(`${route} rejects unauthenticated requests`, async ({ request }) => {
      const response = await request.get(route);

      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ error: 'Authentication required.' });
    });
  }

  test('reports registration as unavailable when Neon Auth cannot be reached', async ({ request }) => {
    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        email: 'offline-test@example.invalid',
        name: 'Offline Test',
        password: 'OfflineOnly-Password-123!',
      },
    });

    if (response.status() !== 502) {
      test.skip(true, 'Live Neon Auth is reachable; offline 502 test only applies when authentication server is unreachable.');
      return;
    }

    expect(response.status()).toBe(502);
    expect(await response.json()).toMatchObject({
      error: 'Unable to connect to authentication server',
      code: 'NETWORK_ERROR',
    });
  });

  test('reports sign-in as unavailable when Neon Auth cannot be reached', async ({ request }) => {
    const response = await request.post('/api/auth/sign-in/email', {
      data: {
        email: 'offline-test@example.invalid',
        password: 'OfflineOnly-Password-123!',
      },
    });

    if (response.status() !== 502) {
      test.skip(true, 'Live Neon Auth is reachable; offline 502 test only applies when authentication server is unreachable.');
      return;
    }

    expect(response.status()).toBe(502);
    expect(await response.json()).toMatchObject({
      error: 'Unable to connect to authentication server',
      code: 'NETWORK_ERROR',
    });
  });
});
