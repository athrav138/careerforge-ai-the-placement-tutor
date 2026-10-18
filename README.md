# CareerForge AI

Next.js App Router, Prisma ORM, Supabase Auth, and Supabase-hosted PostgreSQL.

## Database setup

Configure `DATABASE_URL` with the Supabase pooler connection string and `DIRECT_URL` with the Supabase direct connection string. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Supabase Auth. Keep all credentials in local environment variables or deployment secrets, never in source control.

Install and generate Prisma Client with `npm install` and `npx prisma generate`. Review the existing migration history before applying `npx prisma migrate deploy`. Seed supported career data with `npm run db:seed` when needed, then start with `npm run dev`.

## Neon to Supabase

See [docs/SUPABASE_MIGRATION.md](docs/SUPABASE_MIGRATION.md). PostgreSQL application data and Supabase Auth identities are separate migration concerns. Verify row counts, auth identity mappings, and end-to-end flows before switching production traffic. Keep Neon available for rollback until verification is complete.

The presence of a route or dashboard page does not by itself establish production readiness. Test each feature against configured database and AI services.