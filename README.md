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

1. Set `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`. Get the Supabase values
   from **Project Settings → API** (the project URL and publishable/anon key).
2. Enable Email and Password sign-in in Supabase Authentication. Configure the
   site's URL and callback URLs for local development and your deployed domain.
3. Apply migrations with `npx prisma migrate deploy`
4. Seed career roles with `npm run db:seed`
5. Run `npm run dev`

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
