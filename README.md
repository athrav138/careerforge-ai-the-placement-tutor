# CareerForge AI

Student-only AI placement preparation platform. No admin panel.

## Stack
Next.js (App Router) · React · TypeScript · Tailwind CSS · lucide-react

This repo contains the frontend layout for the product plus working
authentication, PostgreSQL persistence for student profiles and skills, and
a database-backed career skill matching foundation. The remaining dashboard
modules are still being implemented incrementally; they must not be treated
as complete merely because their UI exists.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Route map

Public:
- `/` landing
- `/about`, `/features`, `/how-it-works`, `/research`, `/faq`, `/contact`
- `/login`, `/register`

Dashboard (all under `/dashboard`):
- `/dashboard` overview
- `/dashboard/career`
- `/dashboard/skills`
- `/dashboard/roadmap`
- `/dashboard/resume`
- `/dashboard/aptitude`
- `/dashboard/projects`
- `/dashboard/interview`
- `/dashboard/analytics`
- `/dashboard/mentor`
- `/dashboard/portfolio`
- `/dashboard/profile`
- `/dashboard/settings`

## Design system

Colors, panels, gauges, and score bars live in `src/components/ui`.
Everything shares the same blueprint/forge visual language: deep navy
canvas, dotted grid, cyan trace accents, forge-orange CTAs, monospace
technical labels, corner-bracketed panels.

## Next steps (per the build order)

1. Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and
   `NEON_AUTH_COOKIE_SECRET` in `.env`. Keep database credentials server-side.
2. Use the Auth URL for the Neon branch that matches this app environment.
   Localhost is allowed by default for development; add your exact HTTPS
   production domain under **Neon Console → Auth → Configuration → Domains**.
3. Generate `NEON_AUTH_COOKIE_SECRET` with
   `openssl rand -base64 32`.
4. Apply migrations with `npx prisma migrate deploy`.
5. Seed career roles with `npm run db:seed`.
6. Run `npm run dev`.

### Existing account note

CareerForge's existing PostgreSQL `User` and `StudentProfile` records are
preserved. On their first successful Neon Auth sign-in, a user is matched to
the existing app record by email and the Neon identity is stored separately.
Supabase password hashes cannot be transferred directly to Neon Auth, so
existing password users need to create a Neon Auth password (or use a
configured OAuth provider) with the same email address. Do not delete old
Supabase users or overwrite existing profile IDs as part of this transition.

## Profile and career analysis

Onboarding and `/dashboard/profile` save the authenticated student's profile
to `StudentProfile`, `Skill`, and `StudentSkill`. The Career Intelligence page
loads career roles from PostgreSQL and calls `POST /api/career/analyze`.
That endpoint compares the student's saved skills with the selected role's
required skills and persists each result in `CareerAnalysis`.

The career dataset can be reseeded safely:

```bash
npm run db:seed
```

The matching engine is intentionally transparent and rule-based at this
stage. AI services for career explanations, resume analysis, interviews, and
mentor conversations are future work.
