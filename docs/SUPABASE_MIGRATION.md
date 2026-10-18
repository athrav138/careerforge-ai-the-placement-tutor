# Neon to Supabase migration

This migration requires both database connection strings and must be performed from a trusted local environment. Do not commit credentials.

1. Back up Neon and the destination Supabase database.
2. Export the Neon public schema and data with pg_dump.
3. Restore into the destination Supabase PostgreSQL database using pg_restore. Only use a clean restore on a new or confirmed-empty destination.
4. Configure DATABASE_URL to the Supabase pooler and DIRECT_URL to the Supabase direct connection.
5. Compare row counts for every Prisma model table and verify foreign keys.
6. Verify each User.supabaseUserId maps to an identity in the same Supabase Auth project.
7. Test signup, login, logout, session refresh, profile save/load, career analysis, roadmaps, resumes, assessments, and dashboard analytics.
8. Check file storage separately because PostgreSQL backups do not copy files stored outside the database.
9. Keep Neon available for rollback until deployment and end-to-end tests pass. Only then retire it manually.

Supabase Auth identities are separate from Prisma application tables. A PostgreSQL restore does not copy Auth users or passwords into Supabase Auth. Plan and verify identity migration separately.