import { expect, test } from '@playwright/test';
import { postActionCenterResponse } from '../../src/lib/action-center-response';

test.describe('Action-center API response handling', () => {
  test('maps a transaction failure to an API error without returning success', async () => {
    const previousConsoleError = console.error;
    console.error = () => undefined;
    try {
      const response = await postActionCenterResponse(
        async () => ({ studentProfileId: 'test-profile' }),
        async () => { throw new Error('simulated transaction failure'); },
      );
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Unable to generate actions.' });
    } finally {
      console.error = previousConsoleError;
    }
  });

  test('returns generated actions only after generation resolves', async () => {
    const response = await postActionCenterResponse(
      async () => ({ studentProfileId: 'test-profile' }),
      async () => [{ id: 'action-1' }],
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ actions: [{ id: 'action-1' }] });
  });

  test('rejects a user without a student profile before invoking generation', async () => {
    let generationCalled = false;
    const response = await postActionCenterResponse(
      async () => ({ studentProfileId: null }),
      async () => { generationCalled = true; return []; },
    );
    expect(response.status).toBe(401);
    expect(generationCalled).toBe(false);
  });
});
