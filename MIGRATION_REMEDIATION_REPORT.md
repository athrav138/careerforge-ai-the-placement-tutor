# CareerForge AI — Migration Remediation Investigation

Date: 2026-10-18
Mode: Read-only production investigation plus DDL replay on a new disposable local PostgreSQL 18 database. No production writes, migration resolution, migration-file edits, environment changes, or integration tests.

## Summary

- Prisma P1001 was caused by network reachability from the restricted shell. `.env` was read internally without printing values: `DIRECT_URL` resolves to the active production direct endpoint and `DATABASE_URL` resolves to its pooler. A credential-free DNS/TCP check from the trusted network could reach the direct host on port 5432. Retrying `prisma db pull --print` then succeeded.
- Prisma introspection returned 42 models, matching the repository's 42. A scalar field comparison found zero missing/extra models and zero scalar field/type/nullability differences. The command used `--print`; no Prisma file was written.
- All 16 checked-in migration SQL files replayed successfully, in repository lexical order, on a fresh, empty, disposable local PostgreSQL 18 cluster. This includes `20261018000000_neon_managed_auth`. This was direct ordered SQL replay through `psql` with `ON_ERROR_STOP`, not `prisma migrate deploy` and not a replay against the restored production copy.
- The final disposable schema has a nullable `passwordHash`, nullable text `neonAuthUserId`, and unique index `User_neonAuthUserId_key`.
- On a clean replay, `AssessmentAnswer_attemptId_questionId_key` is represented as a proper UNIQUE constraint plus backing index. Earlier live production catalog inspection showed the same valid unique index with no owning UNIQUE constraint. Both enforce uniqueness on (`attemptId`, `questionId`); the observed difference is catalog representation, not uniqueness behavior. Prisma schema declares `@@unique([attemptId, questionId])`.
- Direct inspection of the ACL-protected restored copy was blocked in this shell. Its original files were preserved. The restore report and earlier source catalog results provide supporting metadata, but this turn did not re-run SQL against that restored copy. Testing the pending SQL on that exact restored copy is therefore not claimed.

## Datasource and P1001 diagnosis

The schema datasource uses `DATABASE_URL` as `url` and `DIRECT_URL` as `directUrl`. Local inspection determined, without outputting values, that `DATABASE_URL` uses the production pooler endpoint and `DIRECT_URL` uses the active production direct endpoint, both for `neondb`. The direct endpoint was not reachable from the restricted execution context, which yielded Prisma P1001. Under the trusted network context, DNS resolution and TCP port 5432 succeeded; then Prisma 5.22.0 `db pull --print --schema prisma/schema.prisma` exited 0. No connection string was printed, environment value changed, or schema file written.

The printed introspection was compared in memory with `prisma/schema.prisma`: 42 models on both sides; zero model-set differences; zero scalar field/type/optional differences. No full comparison of every index, relation attribute, or database object outside Prisma's model scope is claimed.

## AssessmentAnswer evidence

Repository:
- `prisma/schema.prisma` declares `AssessmentAnswer @@unique([attemptId, questionId])` and indexes each field separately.
- `20260926153000_phase4_2_assessment_engine/migration.sql` adds named constraint `AssessmentAnswer_attemptId_questionId_key UNIQUE ("attemptId", "questionId")`.

Live production, from earlier read-only catalog checks:
- A valid unique index with the exact name and exact column pair exists.
- `pg_constraint` reports no owning UNIQUE constraint for that index.

Disposable clean replay:
- The migration succeeds in repository order.
- Final catalog query finds the same named UNIQUE constraint and its backing unique index.

Interpretation: both forms enforce duplicate prevention for the same key pair. The production index is not an unusable or non-unique index; no evidence indicates a behavioral integrity gap. The representation difference may matter to tooling that checks constraint objects or migration drift, so avoid manual history changes based only on equivalence. No production change is recommended for this object without a specific tool requirement and separately tested plan.

## Pending Neon Auth SQL versus observed schema

Pending migration operations:
1. Drop `NOT NULL` from `public."User"."passwordHash"`.
2. Add nullable text `neonAuthUserId` if absent.
3. Create unique index `User_neonAuthUserId_key` if absent.

Read-only production metadata confirms all three target states already exist: `passwordHash` is nullable text; `neonAuthUserId` is nullable text; and the exact named unique btree index exists. The migration does not change `neon_auth` tables or establish a foreign key to `neon_auth."user"`. The verified backup was created after these production schema states were observed, and the prior restore verification establishes a successful archive restore. This turn did not access the protected restored folder directly; exact-copy validation of the migration was not repeated.

The `IF NOT EXISTS` clauses protect only against an existing object name; they do not verify its definition. The live catalog comparison provides evidence the named objects have the expected definition. On an empty database replay, the migration is not redundant: it converts the required password hash from the init schema into nullable form, adds the link field, and creates the unique index. Against current production, the DDL appears redundant; the migration is still absent from production history. Do not resolve or apply it based on this investigation alone.

## Replay experiment

- Created a new disposable PostgreSQL 18.6 cluster and empty database under a unique temporary workspace directory, separate from the ACL-protected restore copy.
- Started the server on loopback port 55441.
- Applied the 16 checked-in `migration.sql` files sorted by directory name using `psql -X -v ON_ERROR_STOP=1`.
- Every migration exited 0, including both migrations that had earlier rolled-back attempts in production.
- Final schema checks passed for User nullable fields and unique link index; AssessmentAnswer has its expected named UNIQUE constraint and backing index.
- Stopped the temporary server process. The original verified restore directory was not opened or changed.

This establishes a successful clean SQL replay in repository order. It does not demonstrate `prisma migrate deploy` behavior against an existing `_prisma_migrations` table, replay from a copy of production, or exact restore-copy behavior. Production's two assessment migrations were historically recorded in the reverse order, but clean replay order works because their scripts target separate objects and have no demonstrated dependency.

## Recommended remediation plan (not executed)

1. Keep production schema and `_prisma_migrations` unchanged. Do not mark the Neon Auth migration resolved and do not deploy it until the application/operations owner chooses how to reconcile an already-present schema with an absent migration record.
2. Treat `AssessmentAnswer` as functionally unique-enforced. If drift tooling requires a UNIQUE constraint object specifically, design and rehearse a narrow constraint-attachment plan on a writable clone first; do not drop the existing index or change production during this investigation.
3. Before approving either production action, regain controlled access to the ACL-protected restored database (or create another verified isolated restore target) and compare its catalogs directly. Preserve the original archive and restore.
4. If the chosen plan depends on Prisma migration history, capture a second current backup and rehearsal/rollback evidence before any separately authorized production operation.
5. Keep live integration testing blocked until configuration demonstrably refuses production and uses the dedicated test branch.

## Verified versus unverified

Verified: production migration checksums/history from read-only Neon MCP; source catalog facts reported above; Prisma 5.22.0 schema validation and `db pull --print`; 42-model/zero scalar-difference comparison; successful 16-file clean SQL replay; final local schema checks.

Unverified: full replay using `prisma migrate deploy`; complete replay on an exact copy of production; direct queries against the existing ACL-protected restore directory in this turn; every possible non-Prisma object/attribute comparison; any production remediation.

No production schema/data/history changed. No repository migration or schema file changed. No environment values changed. No live integration test ran. The three possible production Auth test accounts remain untouched.
