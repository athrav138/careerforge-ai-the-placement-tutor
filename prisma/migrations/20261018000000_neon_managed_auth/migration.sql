-- Link CareerForge profiles to Neon Managed Auth identities.
-- Existing password hashes are retained; new accounts are authenticated by Neon.
ALTER TABLE "User"
    ALTER COLUMN "passwordHash" DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS "neonAuthUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_neonAuthUserId_key" ON "User"("neonAuthUserId");
