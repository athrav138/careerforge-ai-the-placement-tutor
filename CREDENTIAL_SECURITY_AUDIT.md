# CareerForge AI Credential Security Audit

**Audit date:** 2026-10-20
**Scope:** Local repository working tree, ignored local environment files available in the workspace, and all Git objects reachable from local refs.
**Result:** **ACTION REQUIRED** — credentials disclosed in prior chat messages and active-looking local values require owner verification. No live credential validity was tested.

## 1. Executive Summary

The repository is available locally on branch `main`. The working tree already contains user changes; this audit preserved them. The audit was read-only except for creating this requested report. It did not authenticate to a provider, connect to Neon, use `.env.integration.local`, contact GitHub/Google/Vercel, or upload project contents to any scanner.

The following facts require owner action:

- Main Neon database connection material, a Gemini API key, and a GitHub token-encryption key were pasted in earlier conversation messages. Their values are omitted here. Their current validity and deployment use are unknown; if any remain active, treat them as exposed and rotate through their providers using the coordinated steps below.
- The ignored local `.env` currently contains a remote Neon database URL and a 32-byte-base64-shaped `NEON_AUTH_COOKIE_SECRET`. These are not tracked by Git or present in scanned Git history. The database URL is production-shaped, but its provider-side validity and whether it is the deployed production credential were not checked.
- The ignored `.env.integration.local` contains database role credentials, an Auth cookie secret, and a test password. The database password is shared by its pooled and direct URLs, as expected for one role; it differs from the password in local `.env`. Validity and reuse outside this workspace remain **UNVERIFIED**. Do not test the old values by connecting.
- No high-confidence API-token/private-key pattern was found in the Git objects reachable from local refs. The current `.env.example` uses templates/placeholders. A prior broad pattern match in the audit process was a false positive from placeholder/test values; the report does not count those as confirmed Git-history secrets.
- No sensitive `NEXT_PUBLIC_*` variable or secret reference from a client component was found. Current secret references are in server-side libraries, route handlers, tests, or workflow secret expressions.

No credential is confirmed revoked or expired. No external provider configuration was available for validity, usage, or reuse checks.

## 2. Files and Components Inspected

- **Working-tree text files:** 267 files, including tracked/untracked files, `.env`, `.env.example`, `.env.integration.local`, source, API routes, server actions, test files, Prisma schema/config, workflows, documentation, and text configuration. Files were scanned locally with candidate values suppressed; only names, paths, line numbers, statuses, and short SHA-256 fingerprints were emitted.
- **Git history:** 570 text blobs out of 1,246 reachable Git objects, using `git rev-list --objects --all` / `git cat-file --batch`. Local refs included `main` and `origin/main`. Two binary blobs were skipped. No `.log`, `.out`, or `.trace` files were found in the workspace search.
- **Configuration and reference checks:** `.gitignore`, tracked status, `git check-ignore`, variable names in environment files, `process.env` references, `NEXT_PUBLIC_*` references, workflow `secrets.*` references, and Prisma `env(...)` references.
- **Relevant server-side files:** `src/lib/auth-server.ts`, `src/lib/gemini.ts`, `src/lib/mentor/gemini.ts`, `src/lib/github-token-crypto.ts`, and their importers. The reviewed secret-consuming imports were in API routes/server-side modules, not client components.
- **Excluded:** `node_modules`, `.next`, `out`, coverage, `.turbo`, Playwright report/results directories, and binary assets. External Neon, Google, AWS, GitHub, Vercel, CI, and chat-provider settings/history were not queried. This report does not establish what exists outside the local repository and conversation context.

## 3. Confirmed Credential Exposures

“Confirmed” here means a credential value was disclosed in the conversation or a credential-shaped value is present in a local file. It does **not** mean the credential was tested or is currently valid.

| Evidence | Credential type / service | Status and Git exposure | Severity |
| --- | --- | --- | --- |
| Earlier conversation messages contained a main Neon PostgreSQL connection string. A remote database URL is also present in ignored `.env`, line 3. The local password fingerprint is `3d6412e55baf` (12 hex characters of SHA-256; no value shown). | Neon database role password | Chat disclosure confirmed. Local file is ignored/untracked and absent from scanned Git history. Whether the local value is identical to the disclosed value, still valid, or currently used by production is **UNVERIFIED**. No connection was attempted. | **High** pending owner/provider validation; **Critical** if confirmed active for production with broad database privileges. |
| Earlier conversation messages contained a Gemini API key value. Current `.env.example`, line 15, contains a short placeholder; no current local `.env` Gemini key was found. | Google Gemini API key | Chat disclosure confirmed; current account/key validity and deployment use are **UNVERIFIED**. No API request was made. The supplied workspace scan found no matching literal in current source or high-confidence token pattern in reachable Git history. | **High** if still active. |
| Earlier conversation messages contained a GitHub token-encryption key. Current `.env.example`, line 18, contains a template; the local `.env` does not currently define this key. | Application encryption key for stored GitHub tokens | Chat disclosure confirmed; whether it is configured in Vercel or remains active is **UNVERIFIED**. No Vercel settings or stored tokens were inspected or changed. Rotation can make existing encrypted tokens unreadable. | **High** if still active; coordinate before rotation. |

These exposures came from conversation content, not from a tracked local secret file. This report intentionally does not reproduce the values or their fingerprints.

## 4. Potential Exposures Requiring Verification

| File and line | Credential type / service | Evidence without secret value | Git/client status | Validity |
| --- | --- | --- | --- | --- |
| `.env:3` | Neon database role password | Remote PostgreSQL URL; short password fingerprint `3d6412e55baf`. | Ignored and untracked; no Git-history entry. Server/database configuration only. | **UNVERIFIED**; treat as potentially active. |
| `.env:7-8` | AWS access-key pair | Values occur under `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`; short SHA-256 fingerprints are `526b9fe368f9` and `e579417a7122`. Their lengths do not match canonical AWS access-key ID/secret lengths, and no AWS credential reference or S3 client use was found in app source. This may be stale or malformed configuration, but that does not prove the values are harmless. | Ignored and untracked; no Git-history entry. No client reference found. | **UNVERIFIED**; owner should confirm whether any AWS account/key was provisioned or reused. |
| `.env:14` | Neon Auth application cookie-signing secret | Value has a 32-byte-base64-shaped encoding; fingerprint `d73edb4bde9a`. `src/lib/auth-server.ts` reads this variable server-side. | Ignored and untracked; no Git-history entry. No client reference found. | **UNVERIFIED** whether it is used in any deployed environment. |
| `.env.integration.local:3-4` | Neon integration database role password | `DATABASE_URL` and `DIRECT_URL` use the same password fingerprint, `aee6822f31fb`, across pooled/direct endpoints. That is consistent with one database role. The fingerprint differs from local `.env`'s database password. | Ignored and untracked; `git log --all -- .env.integration.local` returned no entries. Do not use these values to test connectivity. | **UNVERIFIED** whether active or reused outside this workspace; treat as potentially exposed. |
| `.env.integration.local:6` | Integration app cookie-signing secret | Local-only value; fingerprint `e27be6b5c263`, distinct from `.env`'s cookie-secret fingerprint. | Ignored/untracked; absent from scanned history. | **UNVERIFIED**. |
| `.env.integration.local:7` | Integration/test Auth password | Local-only `PLAYWRIGHT_TEST_PASSWORD`; fingerprint `cbd285f3dd03`. No attempt was made to authenticate with it. | Ignored/untracked; absent from scanned history. | **UNVERIFIED**; do not use until the owner confirms account and credential status. |

The `.env.integration.local` endpoint and Auth configuration are not themselves passwords. A Neon Auth base URL/JWKS URL is configuration metadata, not a secret. The role password and cookie-signing secret are sensitive.

## 5. Git History Findings

- `git ls-files` confirms `.env` and `.env.integration.local` are not tracked. `git check-ignore` confirms both are ignored by the current `.gitignore`.
- `git log --all` found no history entries for `.env` or `.env.integration.local`.
- `.env.example` is tracked by design. Its current database URLs, cookie key, Gemini key, GitHub encryption key, and test password are templates/placeholders; the current Gemini placeholder is not a provider-shaped key.
- A high-confidence scan of reachable Git blobs found **zero** Google/GitHub/AWS/OpenAI token-shaped literals, JWT-shaped literals, or PEM private-key markers. Other broad matches were code variables, runtime environment references, and test/template values; they were not counted as exposures.
- The scan covers local reachable refs, including the local `origin/main` ref, not GitHub settings or commits unavailable to the local clone. The public visibility/accessibility of each remote commit was not independently queried. Owner should still revoke conversation-disclosed values because Git history results do not cover chat logs or deployment secrets.

## 6. Credential Validity Assessment

| Credential group | Assessment |
| --- | --- |
| Main Neon database credential disclosed in chat / present in local `.env` | **Potentially active; UNVERIFIED.** No database connection or provider lookup was made. |
| Gemini key disclosed in chat | **Potentially active; UNVERIFIED.** No API call or provider lookup was made. |
| GitHub token-encryption key disclosed in chat | **Potentially active in an unknown environment; UNVERIFIED.** Vercel configuration and ciphertext inventory were not accessed. |
| Local integration database/Auth credentials | **Active/revoked status unknown; UNVERIFIED.** Not used to connect or authenticate. |
| Local `.env` AWS-named values | **Potentially malformed/stale; UNVERIFIED.** No canonical key shape or app use was found; provider-side status is unknown. |
| `.env.example` templates and offline test values | **Placeholder/dummy candidates**, not treated as valid service credentials. |
| Neon Auth/JWKS URLs, site URL, and other endpoint metadata | **Not credentials** by themselves. Do not confuse endpoint disclosure with password/key disclosure. |

No item is confirmed expired, revoked, or safe. No discovered credential was used to test validity.

## 7. Potential Credential Reuse

- Fingerprints were compared only among local working-tree secret candidates and scanned Git content. Provider dashboards, CI/Vercel settings, other machines, chat logs, and other projects were not fingerprinted.
- Local main `.env` and integration `.env.integration.local` database passwords have different fingerprints. Their cookie-signing secrets also have different fingerprints. This establishes only that these two local files do not reuse those exact values.
- Within `.env.integration.local`, pooled `DATABASE_URL` and direct `DIRECT_URL` share one role password. That is expected if both URLs address the same integration role, but the owner must confirm the target project/role.
- `.env.example` reuses an obvious placeholder password across example/test URLs; this is not evidence of production credential reuse.
- Whether the chat-disclosed main DB, Gemini, or GitHub-encryption values are reused in local files or deployment settings is **UNVERIFIED**. Do not assume different environment-variable names imply different values.

## 8. Severity Classification

- **Critical — not confirmed from available evidence.** No live account access or active production credential was verified. Upgrade to Critical immediately if the owner confirms an exposed credential is still valid for the production database or grants broad production access.
- **High — action required.** Conversation disclosures of the Neon DB URL, Gemini API key, and GitHub token-encryption key; plus the active-looking remote DB credential in local `.env` and the unresolved integration database credential. Validity is unknown, so treat them as exposed until checked.
- **Medium — owner review.** Local Neon Auth cookie-signing secrets and AWS-named values; their deployment use is unknown. Rotation of a cookie secret invalidates sessions. AWS values do not match canonical key lengths and were not referenced in app code.
- **Low — no live secret finding.** Current `.env.example` templates, public service URLs, `NEXT_PUBLIC_SITE_URL`, runtime `process.env` references, and deterministic offline test placeholders.

## 9. Recommended Security Fixes

1. **Neon database:** In the owner-controlled Neon console, identify the project and role from non-secret metadata. Review access/usage history available to the owner. If the disclosed role credential is active or exposure cannot be ruled out, rotate it and coordinate the application secret update across local, Preview, Production, and CI before revoking the old value. Use a least-privileged app role where practical. Do not test the old password or run migrations as part of rotation.
2. **Gemini:** Check key status and usage in the owner-controlled Google AI Studio/Cloud project. Revoke the disclosed key if active or if status is uncertain; issue a replacement and store it only in server-side environment configuration. Do not place it in a `NEXT_PUBLIC_*` variable, client bundle, source, or logs.
3. **GitHub token encryption:** Inspect Vercel environments and the token inventory privately. Because changing the key may make existing ciphertext undecryptable, first inventory legacy plaintext/encrypted rows and prepare controlled re-encryption or user reauthorization. Then replace the disclosed key in each required environment and verify the affected GitHub token workflow without printing tokens.
4. **Neon Auth:** Confirm which cookie secret is configured in each environment. If an exposed value is deployed, replace it with a newly generated random secret and expect existing sessions to be invalidated. The Neon Auth base URL is public configuration; do not rotate it as though it were a password. Reset any test account password only through the authorized owner/admin flow.
5. **AWS-named values:** Determine whether the project ever received AWS access. If those values correspond to an account credential, revoke/rotate them in AWS even though app code did not reference them. If not used, remove them through an approved local cleanup after preserving any needed user changes.
6. **Git ignore:** Extend ignore coverage for environment files that can contain secrets, for example ignore `.env*` and explicitly allow `!.env.example`. Keep `.env.example` values clearly non-secret templates. Before changing ignore rules, verify no legitimate environment template is unintentionally hidden.
7. **Client/build exposure:** Keep database, Auth cookie, Gemini, and GitHub-encryption variables server-only. Do not define them in `next.config` `env` mappings or `NEXT_PUBLIC_*`. The current scan found no sensitive client reference; retain a CI check to prevent regressions.
8. **Secret scanning:** Add a local/CI secret scanner such as Gitleaks with redacted output and a reviewed allowlist for placeholders. Enable repository secret scanning/push protection if available. Never submit repository content or credentials to a third-party scanning service without explicit approval.
9. **History remediation:** If a provider confirms a live credential was committed to a public/accessible remote at any point, revoke it first. History rewriting does not revoke a secret and can disrupt collaborators; only perform a separately coordinated rewrite after revocation and owner approval.

## 10. Owner Verification Checklist

- [ ] Identify the owner/account for each disclosed credential without pasting any value into chat, issues, or this report.
- [ ] Check Neon project/role access, connection/usage history available, and whether the local main URL is the deployed production role. Rotate if active or uncertain; update dependent secret stores; then revoke the old role credential.
- [ ] Check the integration endpoint in all relevant Neon organizations. Do not connect with the uncertain old credential. If it remains active or exposure cannot be ruled out, rotate/revoke the integration role and reset any affected test account; update only private test configuration.
- [ ] Check Google key status/usage; revoke the previously disclosed Gemini key if active or uncertain and configure a replacement server-side.
- [ ] Check Vercel Production/Preview and CI for the disclosed GitHub encryption key. Inventory stored token formats first, then coordinate key replacement and re-encryption/reauthorization.
- [ ] Check whether the local Auth cookie secret was reused in any deployed environment. If yes, rotate there and account for session invalidation.
- [ ] Check AWS account history/credentials, if the AWS-named local values were ever provisioned. Revoke any corresponding active credential.
- [ ] Review non-local clones, GitHub commit visibility, CI logs/artifacts, Vercel logs, backups, and team secret stores for copies. The local history scan cannot inspect these systems.
- [ ] Record provider-side outcomes as active/revoked/unknown without recording values. Until each check is complete, retain **UNVERIFIED** status.

## 11. Final Security Status

**ACTION REQUIRED.** There is no evidence in this read-only local audit that a credential is currently being abused, and no live credential was tested. However, prior conversation disclosures and active-looking local secret values prevent a PASS. Provider-side validity, reuse, and deployment status remain **UNVERIFIED**. The project owner must complete the checklist, rotate/revoke exposed values that remain active or cannot be cleared, coordinate the GitHub encryption-key change with stored-token remediation, and update this report with provider-side evidence. Do not claim the credentials are safe solely because current tracked files contain placeholders or local environment files are ignored.
