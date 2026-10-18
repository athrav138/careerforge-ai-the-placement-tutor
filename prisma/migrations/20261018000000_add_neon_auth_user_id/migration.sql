-- Additive identity mapping for Managed Neon Auth.
-- Existing User IDs, password hashes, and student records are preserved.
ALTER TABLE "User" ADD COLUMN "neonAuthUserId" TEXT;

CREATE UNIQUE INDEX "User_neonAuthUserId_key"
  ON "User"("neonAuthUserId");
