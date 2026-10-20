# CareerForge AI test summary

Updated: 2026-10-20

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

## Release-readiness follow-up (2026-10-20)

### Verified in the latest run

| Check | Result | Scope and limit |
| --- | --- | --- |
| Production build | Passed | `npm.cmd run build`; Next 16.4.2, Prisma Client 5.22.0. |
| TypeScript | Passed | `npm.cmd exec -- tsc --noEmit`. |
| ESLint | Passed | `npm.cmd run lint`. |
| Prisma schema/client | Passed | `npm.cmd exec -- prisma validate` and `npm.cmd exec -- prisma generate`. |
| Offline API/browser suite | 21/21 passed | `npm.cmd run test:offline`; uses offline/dummy auth, so it does not prove valid sign-in. |
| Main-Neon persistence/isolation | 17/17 passed, exit 0 | `PLAYWRIGHT_MAIN_NEON_AUDIT=true npm.cmd exec -- playwright test --config tests/db/main-neon-audit.config.ts tests/db/persistence-and-security.spec.ts`. This writes synthetic rows to the configured main Neon database, uses generated `.invalid` identities and exact-ID cleanup, and verifies fixture removal. The cross-user checks are direct Prisma queries, not authenticated API checks. |
| Live anonymous Neon Auth | Passed for anonymous session only | Local production app's `/api/auth/get-session` returned 200 with no user. `/api/auth/me`, `/api/profile`, and `/api/readiness` returned 401; `/dashboard` redirected to `/login`. No sign-in, sign-up, reset email, or account mutation was attempted. |
| `git diff --check` | Passed | Existing LF/CRLF conversion notices are informational. |

The two-account authenticated browser/API lifecycle remains blocked: no authorized existing identity pair is configured. The integration test uses generated sign-up addresses, so it was not run. No accounts or emails were created in this follow-up. The ignored `.env.integration.local` exists, but its credential validity and reuse history are unknown; it was not read aloud, used, or modified. Treat it as potentially exposed and rotate its test-only credentials before reusing it.

### Dependency audit

`npm.cmd audit --audit-level=high` exits 1 with 12 findings (7 high, 5 moderate). No dependency files were changed in response because the available fixes are incompatible major changes or do not close the reported ranges:

- `tailwindcss@3.4.19` pulls vulnerable `braces`, `chokidar`, `micromatch`, and `postcss-selector-parser` paths. npm proposes Tailwind 4.3.3, a major upgrade that needs a separate CSS/build migration and visual regression run.
- `eslint-config-next@16.4.2` / `@next/eslint-plugin-next@16.4.2` are in the high-severity dev-tooling path. Registry metadata still reports 16.4.2 as current; npm's offered fix is a downgrade to 14.2.35, incompatible with this Next 16 app. `fast-glob` and `micromatch` are also in this development-tool chain.
- `postcss-nested@6.2.0` and its selector-parser chain are moderate findings; the latest compatible v6 is still 6.2.0, while the audited patched parser range requires a major-compatible update.
- `mammoth@1.13.0` is used by the authenticated, 5 MB-capped DOCX upload route. Its `argparse`/`sprintf-js` audit path appears to be the package CLI: source inspection found no import of those modules in the library extraction path used by the app. This is a reachability observation, not proof that the package is safe. npm's offered fix downgrades Mammoth to 0.3.29, so do not apply it without compatibility testing.

Recheck advisories before remediation. Do not use `npm audit fix --force` or dependency overrides that cross declared major ranges without isolating and testing the resulting build and upload paths.

### Credential handling plan (not executed)

Credentials pasted into conversation are treated as exposed. No provider secret or deployment setting was rotated in this follow-up.

1. **Neon PostgreSQL:** rotate any still-active exposed database password through Neon; coordinate local/Preview/Production `DATABASE_URL` updates and verify connectivity before revoking the old password. Avoid changing production credentials during an uncoordinated deploy.
2. **Neon Auth:** keep the branch Auth URL as configuration, not a secret. Replace any exposed cookie secret with a new random secret in each intended environment; coordinate the rollout because existing app sessions may be invalidated.
3. **Gemini:** revoke any exposed active API key in Google AI Studio/Google Cloud, then configure a replacement as a server-only environment secret. Live Gemini calls remain unverified; the required key is absent from the current local `.env`.
4. **GitHub token encryption:** configure a stable 32-byte key in the required Vercel environments only after an approved change. A key change can make existing ciphertext undecryptable. Prior audit findings reported two legacy-format token rows; re-inventory and plan reauthorization or controlled re-encryption before changing the production key. No Vercel configuration or token rows were changed here.
5. **Integration-only credentials:** determine whether the ignored `.env.integration.local` database/Auth/password credentials are active or reused using the provider dashboards and access history. Rotate them as test-only credentials if exposed or reused; do not transfer them to production.

### Reproduction commands

```powershell
npm.cmd run build
npm.cmd exec -- tsc --noEmit
npm.cmd run lint
npm.cmd exec -- prisma validate
npm.cmd exec -- prisma generate
npm.cmd run test:offline
npm.cmd audit --audit-level=high
$env:PLAYWRIGHT_MAIN_NEON_AUDIT = 'true'
npm.cmd exec -- playwright test --config tests/db/main-neon-audit.config.ts tests/db/persistence-and-security.spec.ts
```

The main-Neon command is opt-in and writes temporary synthetic test fixtures before exact cleanup. Run it only against the verified main endpoint and with the test's cleanup hooks enabled. Authenticated end-to-end testing remains unverified until two authorized existing test identities and an approved safe test method are available.

## Credential and dependency follow-up (2026-10-20)

### `.env.integration.local` assessment

The file is present locally and ignored by Git. `git ls-files` and `git log --all -- .env.integration.local` found no tracked file or history entries. Its last-write date is 2026-10-18. Its database endpoint/password and Neon Auth URL do not match the current local main `.env`; this only rules out reuse between these two local files. The integration project name returned no match in the currently connected Neon account search. No connection attempt or authentication was made with this file.

**Status: active/revoked unknown; reuse outside the local main `.env` unknown.** A project not visible to the current account could still exist under another Neon organization/account. Treat the test password and database credential as potentially exposed until the project owner checks provider access and usage history. Do not infer revocation from the search result. If the owner confirms the test project is still active or the credentials were reused, rotate only the test role/Auth credentials there, update the ignored test configuration privately, and verify with a read-only connection. If the project is retired, have its owner revoke/delete the credentials and retain no copies. This follow-up did not access or change the integration project.

The previously pasted main database and Gemini credentials remain exposure concerns if active. The local integration database credential does not match the current main local password. No provider credential, local secret, Vercel setting, or production token was changed.

### Safe authorized-auth test method

No two existing authorized test identities are configured in the local environment, and the existing `tests/integration/neon-auth.spec.ts` creates random accounts. That signup-based suite remains unrun in this follow-up. Do not run it against main Neon without a separately approved account-creation method.

When two explicitly authorized test identities are available, store their email/passwords only in an ignored, private local environment file or process environment. Do not place values in chat, source, Playwright traces, console output, or committed storage state. Use the current main `NEON_AUTH_BASE_URL` and app session secret; first confirm the identities are designated test accounts and have matching app profiles.

Required test sequence:

1. Sign in as User A in an isolated browser context; assert `/api/auth/me` returns A, reload, and assert the session persists.
2. Sign out; assert `/api/auth/me` and a protected API return 401, and the dashboard redirects to login.
3. Sign in as User B in a separate context and repeat session checks.
4. For cross-user checks, use a synthetic row owned by B with a unique ID. Attempt read/update/delete as A; assert no data is returned or changed. Verify the row is still intact as B, then clean up only that exact ID and verify absence.
5. Exercise one ordinary browser create/update flow on a designated test profile, verify its exact persisted record after page refresh, and delete only that synthetic record. Do not overwrite the profile's existing fields.

The existing main-Neon suite already verifies direct-Prisma isolation and cleanup (17/17); it does not substitute for these authenticated API/browser assertions. Until the identities and safe fixture target are available, valid login/logout, session persistence, cross-user API authorization, and authenticated browser-to-Prisma persistence remain blocked.

### Current npm audit: all 12 package findings

The current `npm.cmd audit --json` reports 7 high and 5 moderate affected package entries. No dependency or lockfile changes were made. The suggested fixes were reviewed against current package metadata and the actual dependency tree:

| Severity | Affected package entries | Path / available path | Safe recommendation and regression coverage |
| --- | --- | --- | --- |
| High (7) | `tailwindcss`, `braces`, `chokidar`, `micromatch` | Tailwind 3.4.19 build/watch dependency chain; braces advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). npm offers Tailwind 4.3.3, a major upgrade. | No safe Tailwind 3 patch is available in the current dependency range. Evaluate Tailwind 4 in a separate branch/worktree after reading its migration guidance. Verify `npm run build`, CSS output, responsive layouts, and visual smoke coverage for public pages and dashboard modules. Do not force an individual transitive override. |
| High (3) | `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob` | Next ESLint tooling at 16.4.2. Current registry metadata still reports 16.4.2; npm suggests downgrading `eslint-config-next` to 14.2.35, incompatible with Next 16. | No compatible patched version identified. Wait for a supported Next 16 ESLint release or vendor-confirmed patch. Then verify `npm run lint`, TypeScript, and production build. Do not downgrade the lint config or override its glob chain across unsupported ranges. |
| Moderate (3) | `mammoth`, `argparse`, `sprintf-js` | Mammoth 1.13.0 is used by the authenticated DOCX upload route. Its `argparse`/`sprintf-js` chain is referenced by the package CLI; source inspection found no import of those modules in the app's `mammoth.extractRawText` library path. This narrows likely reachability but does not clear the audit finding. npm offers Mammoth 0.3.29, a major downgrade. Advisory: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). | Do not downgrade. Track an upstream patch or evaluate replacing the DOCX parser in isolation. Regression tests must cover a valid DOCX upload, malformed DOCX, a size-limit case, ownership scoping, persistence, and PDF upload. Keep the upload feature authenticated and size-limited. |
| Moderate (2) | `postcss-nested`, `postcss-selector-parser` | Tailwind/PostCSS build chain; parser advisory [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). The audited parser fix is 7.1.6+, outside the current parser 6 range; the current compatible PostCSS Nested v6 is 6.2.0. | No compatible v6 patch identified. Address with a tested CSS-toolchain migration (likely alongside Tailwind 4), not an unsupported parser override. Verify build, generated CSS, responsive layouts, and representative visual states. |

The 12 npm entries are dependency paths, not 12 independent application-level exploits. The Tailwind/PostCSS and Next ESLint findings are build/development-tool paths; the Mammoth chain is in a production dependency tree, but the reported formatting path appears CLI-only and was not shown reachable from the app's DOCX extraction call. Reassess reachability and advisories after upstream releases. Do not use `npm audit fix --force`.

### This follow-up evidence

- Main-Neon persistence suite was rerun: **17/17 passed**, exit 0; test cleanup assertions passed.
- Current advisory scan: **exit 1**, 12 entries (7 high, 5 moderate).
- Integration credential checks: ignored/untracked/no Git history; local main DB password and Auth URL differ; current Neon account search found no matching integration project. These checks do not establish revocation or external reuse.
- No source, dependency, lockfile, database schema, provider credential, or deployment changes were made in this follow-up. Authenticated account flows were not attempted.

## Release-readiness continuation (2026-10-20)

### Credential containment status

The private integration file remains ignored, untracked, and absent from Git history. Its endpoint/password and Auth URL differ from the current main local configuration. The named integration project was not returned by Neon search in the connected account. These facts do **not** establish whether the credentials are revoked, valid in another account, or reused elsewhere. No connection attempt was made with them.

**Owner action required:** locate the project/account that owns the integration endpoint; inspect project access, role credentials, Auth user/password state, provider access/usage history, CI/deployment secret stores, and any local copies without pasting values into chat. If activity cannot be ruled out, treat the test credentials as compromised and rotate/revoke them through that provider, then update only legitimate private test configuration. Do not rotate production credentials or change Vercel settings without the separate explicit authorization already required. If the owner cannot find the project, continue treating the credential as untrusted; account search in one connected Neon account is not evidence of revocation.

#### Neon-specific owner checklist

1. In the owner-controlled Neon account, identify the integration project from its non-secret endpoint metadata and confirm the branch and parent. Do not paste connection strings, role names if they reveal internal details, passwords, or Auth user data into tickets or chat. If no matching project is visible, check the other Neon organizations/accounts that may own it; absence from one account does not prove the project is gone.
2. Privately classify the exposed settings before acting: a `DATABASE_URL`/`DIRECT_URL` password is a database role credential; `NEON_AUTH_BASE_URL` is an Auth endpoint, not a password; an Auth user's password is separate; and `NEON_AUTH_COOKIE_SECRET` is an application session-signing secret. Do not attempt a login or database connection with the uncertain old value to test whether it works.
3. Review whatever project access, connection/usage history, Auth account activity, local copies, and CI/deployment secret stores are available to the owner. Record the review date and outcome without recording secret values. If use or exposure cannot be ruled out, rotate the integration database role credential in Neon and reset any affected test Auth account through its approved recovery/admin flow. Update only the private integration configuration and legitimate test secret stores, then revoke the old credential after dependent test consumers are updated. Do not change the main production role as part of integration containment.
4. If the application cookie secret itself was exposed, replace it only in the affected non-production app environment with a newly generated random secret and expect existing app sessions to be invalidated. Coordinate any production change separately. Do not rotate Neon-managed signing material based solely on disclosure of the public Auth URL.
5. After rotation, and only with owner authorization, verify the replacement against the isolated integration project using a read-only connectivity check. Confirm revocation through the provider's control plane; do not retry the uncertain old credential. Never run migrations, writes, or destructive cleanup as part of credential validation.
6. Preserve the existing evidence status as **validity/reuse unknown** until the owner completes those checks. Do not copy integration credentials into `.env`, `.env.example`, source, tests, logs, or this report.

The local main `.env` does not contain the same database password or Neon Auth URL as `.env.integration.local`. This comparison does not check reuse outside the workspace. Existing key material pasted into the conversation (database, Gemini, and GitHub-token-encryption settings) should also be rotated if still active, with coordinated rollout. GitHub token encryption-key rotation must wait for the legacy-token inventory and a re-encryption/reauthorization plan because changing the key can make existing ciphertext undecryptable.

### Private identity setup

`.env.auth-test.local` is covered by `.gitignore` (`git check-ignore` confirmed), but no current test consumes identity values from it. If two project-approved test accounts become available, a future dedicated spec can read `PLAYWRIGHT_EXISTING_USER_A_EMAIL`, `PLAYWRIGHT_EXISTING_USER_A_PASSWORD`, `PLAYWRIGHT_EXISTING_USER_B_EMAIL`, and `PLAYWRIGHT_EXISTING_USER_B_PASSWORD` from that ignored file or a private process environment. Keep Playwright traces, storage state, console logs, and test output free of credentials and session cookies. This setup is a proposal; no identity values were added, and the current signup-based integration suite remains unsuitable because it creates accounts.

### Per-entry npm audit inventory

Refreshed `npm.cmd audit --json`: 7 high and 5 moderate package entries. The `braces`, `postcss-selector-parser`, and `sprintf-js` advisory details below are from their GitHub Security Advisories. Other entries inherit the issue through the named transitive dependency; npm did not report a separate advisory for each wrapper package.

| Package (installed path) | Severity | Advisory/path | Compatible fix availability and impact |
| --- | --- | --- | --- |
| `@next/eslint-plugin-next@16.4.2` | High | `eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces` ([braces GHSA](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | npm suggests `eslint-config-next@14.2.35`; that is a major downgrade incompatible with Next 16. No supported Next 16 patch was identified. Wait for upstream; then rerun lint, TypeScript, and build. |
| `argparse@1.0.10` | Moderate | `mammoth -> argparse -> sprintf-js` ([sprintf-js GHSA](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)) | npm suggests Mammoth 0.3.29, a major downgrade. No compatible patched path identified. The app's Mammoth library extraction call does not import the CLI parser in source; this narrows reachability but does not clear the finding. |
| `braces@3.0.3` | High | Tailwind and glob chains; [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affected `<=3.0.3`, advisory lists no patched release. | No same-major patch identified. Tailwind 4.3.3 is a major migration candidate, not a drop-in fix for every path. Do not override with the still-affected version. |
| `chokidar@3.6.0` | High | `tailwindcss@3.4.19 -> chokidar -> braces` ([braces GHSA](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | Tailwind's `^3.6.0` range has no compatible patched watcher. Evaluate with Tailwind 4 in an isolated branch; test build and stylesheet behavior. |
| `eslint-config-next@16.4.2` | High | Direct dev dependency; inherits `@next/eslint-plugin-next` / `fast-glob` / `micromatch` / `braces` path ([braces GHSA](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | npm proposes 14.2.35, incompatible with Next 16. Registry metadata still reports 16.4.2 as current. No compatible patch identified; do not downgrade. |
| `fast-glob@3.3.1` and nested `3.3.3` | High | Next ESLint and Tailwind paths; `fast-glob -> micromatch -> braces` ([braces GHSA](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | Newer fast-glob 3.x does not remove the affected micromatch/braces path. Updating only fast-glob would not clear the advisory. Fix the consuming package chain when upstream supplies a compatible release. |
| `mammoth@1.13.0` | Moderate | Direct runtime package; `mammoth -> argparse -> sprintf-js` ([sprintf-js GHSA](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)) | No compatible Mammoth patch identified; npm's 0.3.29 suggestion is a major downgrade. If replacing the DOCX parser, test valid/malformed files, size limits, ownership, persistence, and PDF behavior. |
| `micromatch@4.0.8` | High | Tailwind and glob paths; `micromatch -> braces` ([braces GHSA](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | Current 4.x has no patched braces release in its supported dependency range. Do not override only braces; monitor upstream consumers or plan a tested toolchain migration. |
| `postcss-nested@6.2.0` | Moderate | `tailwindcss@3.4.19 -> postcss-nested -> postcss-selector-parser` ([parser GHSA](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)) | npm marks a fix generically, but current compatible v6 is 6.2.0 and its Tailwind range is `^6.2.0`; no compatible patched v6 release was identified. Updating the chain crosses a major boundary. |
| `postcss-selector-parser@6.1.4` | Moderate | Tailwind/PostCSS chain; [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), patched in 7.1.6+. | Tailwind requires `^6.1.2`; 7.1.6+ falls outside that range. Ordinary trusted build-time CSS is not the advisory's exposed scenario; still retain the audit finding until the chain is upgraded compatibly. |
| `sprintf-js@1.0.3` | Moderate | Mammoth CLI dependency; [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), affected through 1.1.3, no patched version listed. | No patched version identified. Avoid the incompatible Mammoth downgrade; isolate/review the CLI path and track a replacement or upstream fix. |
| `tailwindcss@3.4.19` | High | Direct dev dependency; pulls `braces`, `chokidar`, `fast-glob`, `micromatch`, `postcss-nested`, and selector parser paths. | npm offers Tailwind 4.3.3, a major CSS-toolchain migration. Test in a separate worktree with Next production build, generated CSS comparison, responsive page coverage, and visual regression checks. It does not by itself resolve the separate Next ESLint chain. |

The braces advisory describes stack exhaustion from deeply nested patterns and currently lists no patched version; the selector-parser advisory's patched release is 7.1.6; the sprintf-js advisory currently lists no patched version. These findings and versions can change, so refresh `npm audit` and upstream advisories before selecting a remediation. No forced upgrade, override, package edit, or lockfile edit was made.

### Release tests still required

- Owner's provider review of integration credentials; rotate/revoke only if active, reused, or exposure cannot be contained.
- Two authorized existing test identities securely loaded locally.
- Real login, reload/session persistence, logout, and post-logout 401 checks.
- User A versus User B API read/update/delete denial against an exact-ID synthetic record, followed by owner verification and exact cleanup.
- Authenticated browser create/update, Prisma persistence, refreshed UI state, and cleanup.
- Dependency remediation in an isolated worktree once a compatible upstream version or approved migration is available; then rerun build, TypeScript, ESLint, Prisma validation/generation, offline tests, and guarded main-Neon tests.

### High-severity remediation proposal (2026-10-20)

No dependency or lockfile changes were made. A fresh `npm.cmd audit --omit=dev --json` exited **1** and reported **0 high, 3 moderate** entries. This confirms that the seven high findings are in the development/build tool graph, not the production-only graph for this lockfile. It does not make them harmless: they remain relevant when installing, linting, or building the application. Source search found no application imports of `braces`, `chokidar`, `micromatch`, `fast-glob`, `eslint-config-next`, or `@next/eslint-plugin-next`; `tailwindcss` is declared as a dev dependency and is part of the CSS build toolchain. Inference from those paths: the current high findings are not directly exposed through a runtime API route, but a maliciously crafted build input or toolchain compromise remains a build-time concern.

| High finding | Dependency path and app reachability | Fix assessment | Regression coverage before accepting a fix |
| --- | --- | --- | --- |
| `tailwindcss@3.4.19` | Direct dev dependency. Tailwind is used to compile the app's styles; it is not imported by a runtime route. Its v3 graph includes the `braces`, `chokidar`, `fast-glob`, and `micromatch` findings. | npm's proposed `4.3.3` is a major CSS-toolchain migration, not a safe patch. Do not force it. Evaluate Tailwind 4 in an isolated branch after reviewing its migration instructions. | `npm run build`; compare generated CSS; visual/responsive smoke tests for public pages and dashboard on mobile and desktop; verify interactive states and theme styles.
| `braces@3.0.3` | Transitive through glob/matching dependencies used by Tailwind and Next ESLint. No application-level import or user-controlled pattern usage found in the source search. | GHSA-vfj7-8cjw-p6xm affects versions through 3.0.3 and lists no patched release. Keep open; do not pin/override to another still-affected version. Recheck the advisory and consuming ranges before a change. | Once an upstream compatible release exists: install from the updated lockfile, run lint/build and offline tests; add a bounded-pattern regression only if app code begins accepting user-controlled glob patterns.
| `chokidar@3.6.0` | Tailwind v3 watch/build dependency; no app runtime import found. | Tailwind's current range accepts v3.6.0; no safe compatible patched v3 release was identified. Chokidar 4 would be a breaking transitive override. Resolve with a supported Tailwind/toolchain update, not an override. | Run the dev server and verify CSS watch/rebuild after editing a stylesheet; run production build and responsive visual checks after the toolchain migration.
| `micromatch@4.0.8` | Transitive under Tailwind and Next ESLint's globbing path, ultimately affected through `braces`; no app runtime import found. | Updating `micromatch` alone within its current major does not remove the affected `braces` dependency. No compatible resolution identified; keep open pending upstream dependency-range changes. | After the consuming chain is updated: lint/build plus offline suite; verify configured source globs include the expected app, component, and test files.
| `eslint-config-next@16.4.2` | Direct dev dependency used by `npm run lint`; its plugin/glob chain reaches `fast-glob -> micromatch -> braces`. Not loaded in production requests. | npm suggests `14.2.35`, a major downgrade incompatible with the installed Next 16 line. Do not downgrade. Adopt only a supported patched Next 16 ESLint release when one is available. | `npm run lint`, TypeScript, production build, and offline suite; review changed lint diagnostics for removed/changed Next rules.
| `@next/eslint-plugin-next@16.4.2` | Transitive from `eslint-config-next`; affected through the same glob/matching chain. No app runtime import. | It is coupled to the Next ESLint config. No separate compatible patched release was identified; upgrade with a supported `eslint-config-next` release. | Lint, TypeScript, production build, and offline suite; confirm Next-specific rules still run and no lint configuration silently disables them.
| `fast-glob@3.3.1` and nested `3.3.3` | Transitive in both Next ESLint and Tailwind tool paths, then `micromatch -> braces`; no app runtime import. | A fast-glob 3.x-only update does not remove the vulnerable transitive path. Avoid a top-level override; update the consuming toolchain once its ranges point to a resolved chain. | Lint/build; verify file discovery across `src`, `tests`, and configuration files; run offline suite and inspect the final lockfile audit.

The current production-only audit's three moderates are the already-open `mammoth -> argparse -> sprintf-js` path. The resume upload route calls `mammoth.extractRawText` and is authenticated/size-limited; the earlier source review found no use of the `argparse` CLI path in that app call. This is a reachability assessment, not an audit clearance. The two no-patch advisories (`braces` and `sprintf-js`) remain open pending vendor action. Do not force the Mammoth downgrade or selector-parser major change. Re-run the full and production-only audits before approving any remediation because registry advisories and package metadata change.

**Disposition:** defer the seven high findings as build-toolchain risks with no compatible fix established; plan the Tailwind 4 migration separately, and wait for a supported Next 16 lint-toolchain release. No source, package manifest, lockfile, installed dependency, provider configuration, or database was changed for this proposal. Authentication and cross-user browser-to-database tests remain blocked pending two authorized test identities; `.env.integration.local` credentials remain potentially exposed with validity/reuse unknown and require owner/provider review before use.

## Master Release-Readiness Audit (2026-10-20)

### Environment and Runtime

| Component | Version |
| --- | --- |
| Node.js | v24.16.0 |
| npm | v11.13.0 |
| Next.js | 16.4.2 |
| Prisma Client | 5.22.0 |
| React | 19.3.1 |
| TypeScript | 5.4.5 |

### Current Baseline Verification

| Check | Command | Result | Exit Code |
| --- | --- | --- | --- |
| Production build | `npm run build` | Passed | 0 |
| TypeScript | `npx tsc --noEmit` | Passed | 0 |
| ESLint | `npm run lint` | Passed | 0 |
| Prisma schema validation | `npx prisma validate` | Passed | 0 |
| Prisma client generation | `npx prisma generate` | Passed | 0 |
| Offline Playwright suite | `npm run test:offline` | 21/21 passed | 0 |
| GitHub token crypto tests | `npx playwright test tests/local/github-token-crypto.spec.ts` | 2/2 passed | 0 |
| Main-Neon persistence suite | `PLAYWRIGHT_MAIN_NEON_AUDIT=true npx playwright test --config tests/db/main-neon-audit.config.ts tests/db/persistence-and-security.spec.ts` | 17/17 passed | 0 |
| Full dependency audit | `npm audit --audit-level=high` | 12 findings (7 high, 5 moderate) | 1 |
| Production-only audit | `npm audit --omit=dev --audit-level=high` | 3 moderate findings | 0 |

### Test Status Summary

| Test Category | Count | Status | Evidence |
| --- | ---: | --- | --- |
| Offline API tests | 11 | Passed | Unauthenticated API responses, no live auth |
| Offline browser tests | 10 | Passed | Public pages, navigation, protected-route redirects |
| GitHub token crypto tests | 2 | Passed | Encryption/decryption, tampering rejection |
| Main-Neon persistence tests | 17 | Passed | Direct Prisma operations, synthetic fixtures with cleanup |
| Authenticated API tests | 0 | **Blocked** | No authorized test identities |
| Cross-user authorization tests | 0 | **Blocked** | No authorized test identities |
| Browser-to-database E2E tests | 0 | **Blocked** | No authorized test identities |

### Key Findings

#### 1. Authenticated End-to-End Testing - BLOCKED

**Blocker:** No two authorized existing test identities are configured locally.

**Impact:**
- No evidence of valid login/logout flow
- No evidence of session persistence across page refreshes
- No evidence of cross-user authorization enforcement
- No evidence of authenticated browser-to-database workflows
- Direct Prisma tests (17/17 passed) do not prove authenticated API routes work

**Required Action:** Project owner must create or identify two authorized test identities and configure them in `.env.auth-test.local` or process environment. See `AUTH_E2E_RESULTS.md` for detailed setup instructions.

#### 2. Dependency Vulnerabilities - DEFERRED

**Full audit:** 12 findings (7 high, 5 moderate)
**Production-only audit:** 3 moderate findings

**High-severity findings (7):** All in development/build tool graph (Tailwind CSS, Next.js ESLint)
- No compatible patched versions exist within current dependency constraints
- No production runtime exposure
- Tailwind 4.3.3 migration would be breaking change
- Next 16 ESLint patch not yet available

**Moderate-severity findings (5):**
- 3 in production graph (Mammoth → argparse → sprintf-js)
- 2 in build graph (postcss-selector-parser, postcss-nested)
- Mammoth downgrade to 0.3.29 would be breaking change
- Source inspection suggests Mammoth CLI path not used by app, but not proven safe

**Disposition:** Defer all findings until compatible upstream fixes or approved major-version migrations are available. Do not run `npm audit fix --force`. See `DEPENDENCY_REMEDIATION.md` for detailed analysis.

#### 3. Credential Security - OWNER ACTION REQUIRED

**Potentially exposed credentials:**
- Neon PostgreSQL main database password (owner review required)
- Neon Auth cookie signing secret (owner review required)
- `.env.integration.local` database endpoint/password and Auth URL (active/revoked unknown, reuse unknown)
- GitHub token encryption key (missing from Vercel Production/Preview)
- Gemini API key (not in local .env, owner review required)

**GitHub token encryption configuration:**
- Local environment: Key exists with expected 32-byte format
- Vercel Production: Key missing from inspected environment
- Vercel Preview: Key missing from inspected environment
- Legacy token records: Two legacy-format records in main Neon require remediation

**Integration test credentials (.env.integration.local):**
- File exists locally, ignored by Git
- Credentials differ from main .env
- Project not found in current Neon account search
- Active/revoked status: Unknown
- Reuse status: Unknown
- No connection attempt made

**Disposition:** Owner must review provider dashboards, determine credential validity and reuse history, and rotate compromised credentials. Do not attempt to connect with uncertain old credentials. See `CREDENTIAL_REMEDIATION.md` for detailed action items.

#### 4. GitHub Token Encryption - CONFIGURATION GAP

**Status:** Encryption key missing from Vercel Production and Preview environments.

**Impact:**
- GitHub token encryption will fail in production
- Existing tokens may not decrypt without proper key
- Legacy-format tokens require remediation plan

**Required Action:**
1. Configure `GITHUB_TOKEN_ENCRYPTION_KEY` in Vercel Production and Preview
2. Inventory and plan remediation for two legacy-format token records
3. Choose remediation approach: re-encryption or user re-authorization
4. Execute only after owner approval

#### 5. Node 20 CI Compatibility - UNVERIFIED

**Status:** Local environment uses Node 24.16.0; CI compatibility with Node 20 not verified.

**Impact:** Unknown if production build and tests will pass on Node 20 CI runtime.

**Required Action:** Use authorized controlled CI run or appropriate compatible runtime to verify workflow. Do not change CI runtime casually; assess compatibility first.

### Files Changed in This Audit

**Modified:**
- `.env.example`
- `README.md`
- `package.json`
- `package-lock.json`
- `prisma/schema.prisma`
- `docs/NEON_SETUP.md`
- Various source files (API routes, components, libraries)

**Deleted:**
- `MIGRATION_REMEDIATION_REPORT.md`
- `PHASE4.1_VERIFICATION_REPORT.md`
- `PHASE4.2_VERIFICATION_REPORT.md`
- `VERIFICATION_REPORT.md`

**Created:**
- `AUTH_E2E_RESULTS.md` - Authenticated E2E test results and setup instructions
- `DEPENDENCY_REMEDIATION.md` - Detailed dependency vulnerability analysis
- `CREDENTIAL_REMEDIATION.md` - Credential exposure assessment and owner action items
- `.github/workflows/neon-pr-branches.yml` - GitHub workflow for Neon PR branches
- `logo.jpg`, `logo2.png` - Brand assets
- `public/brand/` - Brand asset directory
- Various test files and utility libraries

**Untracked:**
- `logo.jpg`, `logo2.png`
- `public/brand/`
- New test files and utility libraries

### Database Operations Performed

**Main-Neon persistence suite (17/17 passed):**
- Wrote synthetic rows to main Neon database
- Used generated `.invalid` identities
- Exact-ID cleanup for all test fixtures
- Verified fixture removal after cleanup
- No real student data affected
- No migrations applied
- No schema changes

**No other database operations performed in this audit.**

### Reproduction Commands

```powershell
# Quality checks
npm run build
npx tsc --noEmit
npm run lint
npx prisma validate
npx prisma generate

# Offline tests
npm run test:offline

# GitHub token crypto tests
npx playwright test tests/local/github-token-crypto.spec.ts

# Main-Neon persistence suite (opt-in, writes synthetic fixtures)
$env:PLAYWRIGHT_MAIN_NEON_AUDIT = 'true'
npx playwright test --config tests/db/main-neon-audit.config.ts tests/db/persistence-and-security.spec.ts

# Dependency audits
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
```

### Remaining Blockers

| Blocker | Severity | Required Action | Owner Approval |
| --- | --- | --- | --- |
| No authorized test identities | High | Create or identify two authorized test identities for authenticated E2E testing | Required |
| GitHub token encryption key missing from Vercel | High | Configure key in Vercel Production and Preview environments | Required |
| Legacy GitHub token records | Medium | Inventory and plan remediation (re-encryption or re-authorization) | Required |
| Credential exposure review | High | Review provider dashboards for integration credentials and rotate if active/reused | Required |
| Dependency vulnerabilities | Medium | Await compatible upstream fixes or approved major-version migrations | Required for remediation |
| Node 20 CI compatibility | Medium | Verify workflow on Node 20 runtime or assess compatibility | Required for CI deployment |

### Supporting Reports

- **AUTH_E2E_RESULTS.md** - Authenticated end-to-end test results, test identity requirements, and setup instructions
- **DEPENDENCY_REMEDIATION.md** - Detailed dependency vulnerability matrix, compatibility analysis, and remediation plan
- **CREDENTIAL_REMEDIATION.md** - Credential exposure assessment, owner action items, and rotation procedures

### Conclusion

**Overall Status:** **PARTIALLY VERIFIED** - Static checks, offline tests, and direct Prisma operations pass, but critical authenticated workflows remain unverified.

**What Passed:**
- Production build
- TypeScript type checking
- ESLint
- Prisma schema validation and client generation
- Offline Playwright suite (21/21)
- GitHub token cryptography tests (2/2)
- Main-Neon persistence suite (17/17) with synthetic fixtures and cleanup

**What Remains Blocked:**
- Authenticated login/logout flow
- Session persistence across page refreshes
- Cross-user authorization enforcement
- Authenticated browser-to-database workflows
- Server-side authorization on API routes

**What Requires Owner Action:**
- Configure two authorized test identities for authenticated E2E testing
- Configure GitHub token encryption key in Vercel environments
- Review and rotate potentially exposed credentials
- Remediate legacy GitHub token records
- Address dependency vulnerabilities (await upstream fixes or approved migrations)

**Cannot Claim Release-Ready Without:**
1. Successful authenticated end-to-end tests with evidence of proper session management
2. Cross-user authorization verification
3. Authenticated browser-to-database persistence verification
4. GitHub token encryption configured in Vercel environments
5. Credential containment and rotation where exposure is confirmed
6. Dependency remediation or documented risk acceptance

**Evidence Required Before Release:**
- Authenticated login/logout, session persistence, and post-logout 401 checks
- User A versus User B cross-user authorization matrix
- At least one authenticated browser-to-database workflow per major module
- GitHub token encryption working in production environment
- Clean dependency audit or documented risk acceptance for remaining findings
- Credential rotation confirmation for any exposed secrets
