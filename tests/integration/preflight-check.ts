type PreflightOptions = {
  readDatabaseName: () => Promise<string>;
  authBaseUrl?: string;
  fetchAuthEndpoint?: (url: string, init: RequestInit) => Promise<Response>;
};

/** Shared fail-closed check; dependencies are injectable so failures can be tested without network access. */
export async function verifyIntegrationTarget({
  readDatabaseName,
  authBaseUrl,
  fetchAuthEndpoint = fetch,
}: PreflightOptions): Promise<void> {
  try {
    if (await readDatabaseName() !== 'neondb') throw new Error('Unexpected database identity.');

    if (authBaseUrl) {
      const response = await fetchAuthEndpoint(`${authBaseUrl.replace(/\/$/, '')}/reference`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Auth endpoint did not respond successfully.');
    }
  } catch {
    throw new Error('Integration target preflight failed; no integration tests were started. Check the approved test database and Auth endpoint.');
  }
}
