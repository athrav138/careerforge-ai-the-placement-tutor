# Neon setup and authentication

CareerForge AI uses a Neon PostgreSQL database through Prisma and Neon Managed
Better Auth for sign-in, registration, sessions, Google OAuth, email
verification, and password recovery. The browser never receives a database
connection string.

## Configure Neon

1. In the Neon Console, select the intended project and branch, then enable
   Managed Better Auth under **Auth → Configuration**.
2. Copy the branch's Auth URL into `NEON_AUTH_BASE_URL`. Auth is branch-scoped;
   use the same branch as `DATABASE_URL`.
3. Configure a unique `NEON_AUTH_COOKIE_SECRET` with at least 32 characters.
4. Add the local and deployed application origins to the Auth trusted-domain
   list. Configure Google OAuth credentials in Neon if Google sign-in is
   enabled.
5. Set up custom SMTP before production. Neon shared SMTP is intended for
   development; the production checklist recommends custom SMTP.

## Configure the application

Use `.env.example` as the variable list. Set:

- `DATABASE_URL`: Neon pooled connection used by the app and Prisma. The
  project's Prisma version supports Neon migrations through the pooled URL.
- `DIRECT_URL`: optional direct connection used by guarded Neon audit and
  integration-test scripts; it is not required by the application schema.
- `NEON_AUTH_BASE_URL`: the Auth URL for the same Neon branch.
- `NEON_AUTH_COOKIE_SECRET`: random secret, at least 32 characters.
- `NEXT_PUBLIC_SITE_URL`: exact application origin, with scheme and no path.
- `GEMINI_API_KEY`: optional server-side Gemini integration.
- `GITHUB_TOKEN_ENCRYPTION_KEY`: base64-encoded 32-byte server-only key for
  GitHub token encryption. Keep it stable while encrypted tokens exist. Configure
  it as a Vercel Secret in each environment that runs GitHub sync.

Do not commit `.env` or place database credentials in `NEXT_PUBLIC_*` variables.

## Prisma and application profiles

Neon Auth owns authentication credentials and sessions. CareerForge's Prisma
`User` table stores the application profile and links it with
`neonAuthUserId`. Existing password hashes remain in place for recovery and
are not used to authenticate new sessions. Linking an existing profile by
email requires a verified Neon Auth email.

The checked-in `20261018000000_neon_managed_auth` migration makes the legacy
password hash nullable and adds the Neon identity link. All 16 checked-in
migrations have been applied and checksum-verified on the separate
`CareerForge-AI-integration-test` project only. No production migration was
applied. Before running migrations against a database with existing records,
verify a recoverable backup and review the current migration history. Do not
reset the database.

## Local startup

After setting the environment variables:

```powershell
npm install
npx prisma validate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Only deploy the migration after verifying the target branch and its backup.
Then verify account registration, email verification, sign-in, Google OAuth if
configured, session persistence, protected routes and APIs, sign-out, password
recovery, and Prisma-backed profile persistence.

## Integration status

The previously used integration configuration is stale: its pinned branch and
endpoint are not present in the currently connected Neon project inventory.
The ignored `.env.integration.local` file was preserved and its values were not
displayed. Do not run the legacy integration scripts until an authorized test
branch and identity are confirmed. On that now-unavailable target, Neon Auth
previously returned HTTP 403 `feature_not_supported` for test signup; this does
not establish current Auth behavior. Valid login/logout and dependent
session/profile flows remain unverified. The separate guarded main-Neon
persistence suite uses only uniquely named synthetic rows and exact cleanup; it
does not exercise authenticated APIs.
