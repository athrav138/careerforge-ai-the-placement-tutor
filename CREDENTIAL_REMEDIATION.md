# Credential Remediation Report

**Generated:** 2026-10-20
**Environment:** Node v24.16.0, npm v11.13.0

## Executive Summary

This report assesses credential exposure risks and provides owner action items for credential containment and rotation. No credentials were rotated, modified, or disclosed during this assessment.

## Credential Categories

| Category | Secret Status | Exposure Risk | Current Status |
| --- | --- | --- | --- |
| Neon PostgreSQL (main production) | Database role password | High if exposed | Owner review required |
| Neon Auth (main production) | Cookie signing secret | High if exposed | Owner review required |
| Neon Auth (integration test) | Database endpoint/password, Auth URL | Potentially exposed | Active/revoked unknown; reuse unknown |
| GitHub token encryption key | 32-byte encryption key | High if exposed | Missing from Vercel Production/Preview; exists locally |
| Gemini API key | API key | High if exposed | Not present in local .env; owner review required |
| Application session cookies | Session material | Medium if exposed | Requires cookie secret review |

## Detailed Assessment

### 1. Neon PostgreSQL (Main Production)

**Credential Type:** Database role password (DATABASE_URL/DIRECT_URL)

**Current State:**
- Database endpoint and password stored in local `.env` (ignored by Git)
- Main Neon database contains real application data
- Previous exposure: Database password may have been disclosed in conversation history

**Owner Action Required:**
1. Verify whether the current production database password has been exposed in any:
   - Conversation history
   - Ticket systems
   - Screenshots
   - Public repositories
   - CI/CD logs
2. If exposure cannot be ruled out:
   - Rotate the database role password through Neon console
   - Update local `.env` with new password
   - Update Vercel Production environment variable (DATABASE_URL)
   - Update Vercel Preview environment variable (DATABASE_URL)
   - Verify connectivity with new password before revoking old one
   - Revoke old password after confirming new password works
3. Do not rotate during uncoordinated deploy - coordinate rollout to avoid service interruption

**Impact:** Rotation invalidates all existing connections; requires coordinated update across environments.

### 2. Neon Auth (Main Production)

**Credential Type:** Application cookie signing secret (NEON_AUTH_COOKIE_SECRET)

**Current State:**
- Cookie secret stored in local `.env` (ignored by Git)
- Used by `@neondatabase/auth` to sign session cookies
- Previous exposure: Cookie secret may have been disclosed in conversation history

**Distinguishing Configuration from Credentials:**
- `NEON_AUTH_BASE_URL` (Auth endpoint) is **public configuration**, not a secret
- `NEON_AUTH_COOKIE_SECRET` is a **private signing key** and must be protected

**Owner Action Required:**
1. Verify whether the cookie secret has been exposed
2. If exposure cannot be ruled out:
   - Generate a new random 32+ character secret
   - Update local `.env` with new secret
   - Update Vercel Production environment variable (NEON_AUTH_COOKIE_SECRET)
   - Update Vercel Preview environment variable (NEON_AUTH_COOKIE_SECRET)
   - Expect existing application sessions to be invalidated after rotation
   - Coordinate rollout with user communication if applicable
3. Do not rotate Neon-managed signing material based solely on disclosure of the public Auth URL

**Impact:** Rotation invalidates all existing user sessions; users will need to re-authenticate.

### 3. Neon Auth (Integration Test - .env.integration.local)

**Credential Type:** Integration-only database endpoint/password and Auth URL

**Current State:**
- File exists locally and is ignored by Git (`.env*.local` pattern)
- Last-modified: 2026-10-18
- Database endpoint/password and Neon Auth URL differ from current main `.env`
- Integration project name not found in current connected Neon account search
- No Git history for this file
- Active/revoked status: **Unknown**
- Reuse status: **Unknown**

**Assessment Constraints:**
- A project not visible to the current account could still exist under another Neon organization/account
- Absence from one account's search does not prove the project is gone
- No connection attempt or authentication was made with this file

**Owner Action Required:**
1. **Locate the project/account** that owns the integration endpoint:
   - Search all Neon organizations/accounts that may own the project
   - Identify the project from its non-secret endpoint metadata
   - Confirm the branch and parent project
   - Do not paste connection strings, role names, passwords, or Auth user data into tickets or chat
2. **Privately classify the exposed settings** before acting:
   - `DATABASE_URL`/`DIRECT_URL` password = database role credential
   - `NEON_AUTH_BASE_URL` = Auth endpoint (public configuration, not a password)
   - Auth user's password = separate credential
   - `NEON_AUTH_COOKIE_SECRET` = application session-signing secret
3. **Review project access and usage history:**
   - Check project access logs
   - Review connection/usage history
   - Check Auth account activity
   - Identify local copies and CI/deployment secret stores
   - Record review date and outcome without recording secret values
4. **If use or exposure cannot be ruled out:**
   - Rotate the integration database role credential in Neon
   - Reset any affected test Auth account through approved recovery/admin flow
   - Update only the private integration configuration and legitimate test secret stores
   - Revoke the old credential after dependent test consumers are updated
   - Do not change the main production role as part of integration containment
5. **If the application cookie secret itself was exposed:**
   - Replace it only in the affected non-production app environment
   - Use a newly generated random secret
   - Expect existing app sessions to be invalidated
   - Coordinate any production change separately
   - Do not rotate Neon-managed signing material based solely on disclosure of the public Auth URL
6. **After rotation (with owner authorization):**
   - Verify the replacement against the isolated integration project using a read-only connectivity check
   - Confirm revocation through the provider's control plane
   - Do not retry the uncertain old credential
   - Never run migrations, writes, or destructive cleanup as part of credential validation
7. **If the owner cannot find the project:**
   - Continue treating the credential as untrusted
   - Account search in one connected Neon account is not evidence of revocation
   - Delete local copies of the credential
   - Do not attempt to connect with the uncertain old value

**Conclusion:** The local integration database credential does not match the current main local password. This comparison does not check reuse outside the workspace. Status remains **validity/reuse unknown** until owner completes provider review.

### 4. GitHub Token Encryption

**Current Implementation:**
- Library: `src/lib/github-token-crypto.ts`
- Algorithm: AES-256-GCM
- Key format: 32-byte base64-encoded key
- Token format: `v1:iv:authTag:ciphertext` (colon-delimited)
- Key source: `GITHUB_TOKEN_ENCRYPTION_KEY` environment variable

**Crypto Test Results:**
- Tests: 2/2 passed
- Coverage: Encryption produces ciphertext distinct from plaintext; decryption restores original; tampering rejected; missing keys fail safely

**Configuration Status:**
- Local environment: Key exists and has expected 32-byte format
- Vercel Production: `GITHUB_TOKEN_ENCRYPTION_KEY` was **missing** from inspected environment
- Vercel Preview: `GITHUB_TOKEN_ENCRYPTION_KEY` was **missing** from inspected environment

**Legacy Token Records:**
- Previous audit found: Two legacy-format GitHub token records in main Neon
- Legacy format implications: May not decrypt with current v1 implementation
- Risk: Changing encryption key can make existing ciphertext undecryptable

**Owner Action Required:**
1. **Configure stable encryption key:**
   - Generate a 32-byte random key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - Add `GITHUB_TOKEN_ENCRYPTION_KEY` to Vercel Production environment
   - Add `GITHUB_TOKEN_ENCRYPTION_KEY` to Vercel Preview environment
   - Verify key is exactly 32 bytes when base64-decoded
2. **Inventory legacy token records:**
   - Query main Neon database for GitHub connection records with non-v1 token format
   - Identify which records are affected by legacy format
   - Document record IDs and Neon Auth user ownership
   - Do not bulk-decrypt or expose token contents
3. **Plan legacy-token remediation:**
   - **Option A (re-encryption):** Decrypt legacy tokens with old key, re-encrypt with new key, update records
     - Requires old key to be available
     - Requires user re-authorization if old key is lost
   - **Option B (re-authorization):** Notify affected users to re-connect GitHub accounts
     - Safer if old key is unavailable
     - Requires user action per affected account
   - **Option C (no action):** If legacy records are test-only or unused, allow natural expiration
     - Verify records are not production data
     - Confirm no active usage
4. **Execute remediation only after owner approval:**
   - Do not change production key without approved plan
   - Do not bulk-re-encrypt records without verifying ownership
   - Do not revoke production tokens without user notification
5. **Verify configuration after changes:**
   - Run crypto tests: `npx playwright test tests/local/github-token-crypto.spec.ts`
   - Test encryption/decryption with dummy token
   - Verify existing production tokens still decrypt (if re-encryption chosen)

**Critical Constraint:** Changing `GITHUB_TOKEN_ENCRYPTION_KEY` without re-encrypting existing tokens will make them permanently undecryptable. Any production token changes require explicit owner approval.

### 5. Gemini API Key

**Current State:**
- Not present in local `.env`
- Required for AI mentor functionality
- Previous exposure: May have been disclosed in conversation history

**Owner Action Required:**
1. Verify whether the Gemini API key has been exposed
2. If exposure cannot be ruled out:
   - Revoke the active API key in Google AI Studio/Google Cloud
   - Configure a replacement API key as a server-only environment secret
   - Add to local `.env` (ignored by Git)
   - Add to Vercel Production environment (if applicable)
   - Add to Vercel Preview environment (if applicable)
   - Verify AI mentor functionality with new key
3. Live Gemini calls remain unverified; the required key is absent from current local `.env`

### 6. Application Session Cookies

**Current State:**
- Session cookies signed with `NEON_AUTH_COOKIE_SECRET`
- Cookies should use HttpOnly, Secure, SameSite attributes
- Sensitive session material should not be exposed to browser JavaScript

**Owner Action Required:**
1. Review Neon Auth SDK cookie configuration
2. Verify cookies use expected security attributes:
   - `HttpOnly`: Prevent JavaScript access
   - `Secure`: Only transmit over HTTPS
   - `SameSite`: CSRF protection (Strict or Lax)
3. Verify session material does not appear in:
   - Browser console logs
   - API responses
   - Server logs
4. If cookie secret is rotated (see section 2), coordinate session invalidation

## Remediation Priority

| Priority | Credential | Reason | Owner Action |
| --- | --- | --- | --- |
| **P0** | GitHub token encryption key | Missing from Vercel environments; legacy tokens at risk | Configure key in Vercel; plan legacy-token remediation |
| **P0** | Neon Auth cookie secret | Signing key; session compromise if exposed | Rotate if exposure confirmed; coordinate session invalidation |
| **P1** | Neon PostgreSQL password | Database access; data compromise if exposed | Rotate if exposure confirmed; coordinate across environments |
| **P1** | Integration test credentials | Potentially exposed; validity unknown | Owner review via provider dashboards; rotate if active/reused |
| **P2** | Gemini API key | AI mentor functionality; not currently in local .env | Configure replacement if needed; revoke exposed key |
| **P2** | Session cookie attributes | Security hardening | Review and configure SDK settings |

## Rotation Safety Rules

### Do NOT
- Attempt to connect using uncertain old credentials to test whether they work
- Disclose credentials in chat, source code, test output, Playwright traces, or console logs
- Rotate production credentials during uncoordinated deploy
- Change encryption key without re-encrypting existing tokens or notifying users
- Apply migrations or schema changes as part of credential validation
- Revoke credentials before confirming new credentials work
- Delete or truncate database tables as part of credential containment

### Do
- Generate new credentials using provider consoles or approved tools
- Update environment variables in local, Preview, and Production environments
- Verify connectivity with new credentials before revoking old ones
- Coordinate rollout with user communication if sessions will be invalidated
- Revoke old credentials only after confirming new credentials work
- Document rotation date and outcome without recording secret values
- Use read-only connectivity checks for verification where possible

## Verification After Rotation

After any credential rotation, verify:

1. **Database connectivity:**
   ```powershell
   npx prisma db push --accept-data-loss  # Only if schema change is intended
   npx prisma validate
   npx prisma generate
   ```

2. **Authentication:**
   - Test sign-in with valid credentials
   - Test sign-in with invalid credentials
   - Verify session persistence after page refresh
   - Verify logout invalidates session

3. **GitHub token encryption:**
   ```powershell
   npx playwright test tests/local/github-token-crypto.spec.ts
   ```

4. **Production build:**
   ```powershell
   npm run build
   ```

5. **Application functionality:**
   - Test critical user workflows
   - Verify database queries succeed
   - Verify external integrations work (GitHub, LinkedIn, Gemini)

## Conclusion

**Status:** Multiple credential exposure risks require owner review and potential rotation. No credentials were rotated, modified, or disclosed during this assessment.

**Immediate Owner Actions Required:**
1. Configure `GITHUB_TOKEN_ENCRYPTION_KEY` in Vercel Production and Preview environments
2. Inventory and plan remediation for two legacy-format GitHub token records in main Neon
3. Review integration test credentials via provider dashboards; rotate if active or reused
4. Verify exposure history for production database password, cookie secret, and Gemini API key
5. Rotate any confirmed exposed credentials with coordinated rollout

**Blockers:** Authenticated end-to-end testing remains blocked pending two authorized test identities. Credential rotation must precede any production deployment to avoid shipping exposed secrets.

**Documentation:** This report does not contain actual credential values. All secrets were kept out of the report and conversation.
