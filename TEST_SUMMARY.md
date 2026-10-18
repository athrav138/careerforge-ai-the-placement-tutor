# CareerForge AI test summary

Updated: 2026-10-18

## Test groups

| Group | Count | Latest verified result | Coverage and limits |
| --- | ---: | --- | --- |
| Offline API (`tests/api/auth.spec.ts`) | 11 | 11 passed | Unauthenticated API responses and expected unavailable-auth behavior against dummy endpoints. Does not establish live authentication. |
| Offline browser (`tests/e2e/auth.spec.ts`, `careerforge-browser.spec.ts`) | 8 | 8 passed | Public pages, forms, navigation, and protected-route redirects; no successful live sign-in. |
| Local transaction/API/preflight (`tests/local`) | 8 | 8 passed in the prior reported run | Transaction rollback/commit, API response mapping, and mocked connection guards. |
| Neon Auth API (`tests/api/neon-auth-and-security.spec.ts`) | 4 | 4 passed in latest live run | Invalid and malformed requests were rejected. |
| Neon database persistence/security (`tests/db/persistence-and-security.spec.ts`) | 9 | 9 passed in latest live run | Persistence and cross-user isolation on the dedicated Neon integration project. |
| Neon Auth browser (`tests/integration/neon-auth.spec.ts`) | 2 lifecycle cases | Incomplete and intermittent | Registration diagnostics still pass. In one rebuilt lifecycle run, persisted `storageState` restored the same identity in a new browser context, logout completed, and protected Auth/profile endpoints returned 401. That scenario timed out in a later run. The profile/security scenario repeatedly timed out on `/api/auth/me` before profile persistence, duplicate registration, action ownership, or cross-user assertions. Do not count the full lifecycle as passing. |

Routine commands `npm test` / `npm run test:offline` run only the 19 offline tests. `npm run test:integration` is guarded to the dedicated test project and uses one worker. `npm run db:integration:deploy` deploys only the checked-in migrations after exact endpoint, branch, empty-state, and Auth preflight checks. `npm run db:integration:cleanup` removes only generated synthetic identities in the recorded per-run cleanup file, then verifies the test target is empty.

## Dedicated integration target

The isolated Neon project is `CareerForge-AI-integration-test` (PostgreSQL 18.6, project `divine-hall-09601900`, branch `br-shy-hill-b4dsm90r`, endpoint `ep-plain-poetry-b4cy32gr`). All 16 repository migrations were deployed successfully to this project, and their recorded checksums match the checked-in SQL. Neon Auth metadata reports email/password sign-up enabled, email verification not required, and `allow_localhost: true`; the explicit trusted-origin list is empty. A minimal raw sign-up request to the configured test Auth endpoint with `Origin: http://localhost:3100` returned HTTP 200. The same request with `Origin: http://127.0.0.1:3100` returned HTTP 403 `INVALID_ORIGIN`. Guarded browser runs use `http://localhost:3101` consistently for Playwright and `NEXT_PUBLIC_SITE_URL` and the runner fails if port 3101 is occupied.

The earlier focused browser failures were caused by a test selector that treated an empty `role="alert"` element as an Auth error. The selector now waits for populated alert text. In the successful diagnostic run, the browser registration reached the dashboard; aggregate read-only counts observed the resulting Auth user, session, account, and application profile. There was no provider rejection, so no raw error body or HTTP failure status exists for that successful request. The server action now logs a timestamp, request origin, request ID when safely formatted, status, SDK code, and sanitized message only when Auth rejects a registration. Neon SDK errors may normalize the provider body; a failure requiring raw-body diagnosis remains unobserved. This single diagnostic does not cover reload persistence, logout, duplicate signup, or cross-user behavior. The upstream Neon SDK report may be relevant but does not establish this project's cause: [Neon issue #239](https://github.com/neondatabase/neon-js/issues/239).

The full lifecycle attempts exposed intermittent Auth request timeouts (`/api/auth/me`, including an SDK `mintSessionDataCookie` timeout). The profile/security test did not reach profile persistence, duplicate registration, or cross-user checks. The separate-context session restoration and logout assertion passed once after a rebuilt app, then timed out on a subsequent run; treat this as an intermittent result, not a reliable pass. Each run's generated identities were removed with the guarded cleanup. Final verification after the latest run confirmed 16 migrations remained and application users, Auth users, sessions, and accounts were empty. Prisma `P1001` occurred under the restricted workspace network; the same isolated endpoint was reachable after the authorized network-enabled check. The existing `auth-integration-test` branch, which has records of unknown origin, remains untouched and rejected by the guard.

## Quality checks

- TypeScript: passed (`npx.cmd tsc --noEmit`).
- ESLint: passed (`npm.cmd run lint`).
- `git diff --check`: passed before the final documentation/cleanup-script edits; rerun after edits.
- `npx.cmd next build`: passed.
- Latest TypeScript, ESLint, and `git diff --check`: passed after the auth lifecycle changes.
- `npm.cmd run build`: Prisma client generation hit Windows `EPERM` while renaming the query-engine DLL. Running the Next build directly succeeded using the already generated client.

Production Neon, production Auth, production migration history, and the three possible production test accounts were not changed or used. No data was transferred. The current production backup remains restore-verified; production migration and cutover remain out of scope.
