# CareerForge AI

Next.js App Router, React, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL,
Neon Managed Auth, and lucide-react. Student-only placement preparation platform.

The repository contains dashboard modules for career and skill matching,
roadmaps, resumes, aptitude assessments, interview practice, readiness
analytics, project recommendations, AI mentoring, GitHub and LinkedIn
intelligence, job matching, and career actions. Feature presence does not by
itself confirm production readiness; follow the verification notes and
migration runbook before deploying.

## Routes

Public: `/`, `/about`, `/features`, `/how-it-works`, `/research`, `/faq`,
`/contact`, `/login`, `/register`.

Dashboard: `/dashboard`, `/dashboard/career`, `/dashboard/skills`,
`/dashboard/roadmap`, `/dashboard/resume`, `/dashboard/aptitude`,
`/dashboard/projects`, `/dashboard/interview`, `/dashboard/analytics`,
`/dashboard/mentor`, `/dashboard/portfolio`, `/dashboard/profile`,
`/dashboard/settings`, `/dashboard/jobs`, `/dashboard/action-center`,
`/dashboard/github`, and `/dashboard/linkedin`.

## Local setup

1. Copy `.env.example` to `.env`. Set `DATABASE_URL` to the Neon pooled
   connection. The app and Prisma use this URL for queries and Prisma commands.
   `DIRECT_URL` is optional for guarded Neon audit/integration test scripts; if
   configured, it must point to the same intended database branch.
2. Enable Neon Managed Better Auth on the intended Neon branch. Set
   `NEON_AUTH_BASE_URL` to that branch's Auth URL and generate a unique
   `NEON_AUTH_COOKIE_SECRET` with at least 32 characters. Set
   `NEXT_PUBLIC_SITE_URL` to the local or deployed application origin.
3. Install dependencies and validate the Prisma schema: `npm install`, then
   `npx prisma validate`.
4. Before applying migrations to a database with existing data, verify a
   recoverable backup. Then apply checked-in migrations with
   `npx prisma migrate deploy`.
5. Seed reference career data with `npm run db:seed`, then run `npm run dev`.

See [the Neon setup guide](docs/NEON_SETUP.md) for Auth settings, callbacks,
database migration notes, and the safe setup order.

## Design system

Colors, panels, gauges, and score bars live in `src/components/ui`. The shared
visual language uses a deep navy canvas, dotted grid, cyan trace accents,
forge-orange CTAs, monospace technical labels, and corner-bracketed panels.

## Profile and career analysis

Onboarding and `/dashboard/profile` save the authenticated student's profile
to `StudentProfile`, `Skill`, and `StudentSkill`. The Career Intelligence page
loads career roles from PostgreSQL and calls `POST /api/career/analyze`. That
endpoint compares saved skills with the selected role's required skills and
persists results in `CareerAnalysis`. The dataset can be reseeded with
`npm run db:seed`.

Career-role matching is transparent and rule-based. Interview evaluation and
mentor responses use Gemini when the server-side API key is configured. The
presence of a route or dashboard page does not by itself establish production
readiness; test each feature against configured database and AI services.
