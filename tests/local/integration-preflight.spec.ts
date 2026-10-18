import { expect, test } from '@playwright/test';
import { verifyIntegrationTarget } from '../integration/preflight-check';

test.describe('Integration preflight fail-closed checks', () => {
  test('rejects an unexpected database identity', async () => {
    await expect(verifyIntegrationTarget({
      readDatabaseName: async () => 'production_database',
    })).rejects.toThrow('Integration target preflight failed');
  });

  test('aborts when the database identity query fails', async () => {
    await expect(verifyIntegrationTarget({
      readDatabaseName: async () => { throw new Error('simulated unreachable database'); },
    })).rejects.toThrow('Integration target preflight failed');
  });

  test('aborts when the test Auth endpoint is unreachable', async () => {
    await expect(verifyIntegrationTarget({
      readDatabaseName: async () => 'neondb',
      authBaseUrl: 'https://test.invalid/neondb/auth',
      fetchAuthEndpoint: async () => { throw new Error('simulated network failure'); },
    })).rejects.toThrow('Integration target preflight failed');
  });

  test('accepts a reachable test-shaped target in the local mock only', async () => {
    let authProbeCalled = false;
    await expect(verifyIntegrationTarget({
      readDatabaseName: async () => 'neondb',
      authBaseUrl: 'https://test.invalid/neondb/auth',
      fetchAuthEndpoint: async () => {
        authProbeCalled = true;
        return new Response(null, { status: 200 });
      },
    })).resolves.toBeUndefined();
    expect(authProbeCalled).toBe(true);
  });
});
