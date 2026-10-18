import "server-only";

import { prisma } from "@/lib/prisma";

type AuthIdentity = {
  id: string;
  email: string;
  name?: string | null;
};

async function ensureStudentProfile(userId: string) {
  await prisma.studentProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/**
 * Keeps CareerForge's existing User/StudentProfile IDs stable while linking
 * a Neon Auth identity. Legacy password hashes are deliberately not changed:
 * authentication is now handled by Neon Auth.
 */
export async function ensureAppUser(identity: AuthIdentity) {
  const email = identity.email?.trim().toLowerCase();
  if (!identity.id || !email) {
    throw new Error("Neon Auth returned a user without an ID or email.");
  }

  const linked = await prisma.user.findUnique({
    where: { neonAuthUserId: identity.id },
  });

  if (linked) {
    await ensureStudentProfile(linked.id);
    return linked;
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    if (existing.neonAuthUserId && existing.neonAuthUserId !== identity.id) {
      throw new Error("This email is already linked to another Neon Auth identity.");
    }

    const mapped = existing.neonAuthUserId
      ? existing
      : await prisma.user.update({
          where: { id: existing.id },
          data: { neonAuthUserId: identity.id },
        });

    await ensureStudentProfile(mapped.id);
    return mapped;
  }

  try {
    return await prisma.user.create({
      data: {
        name: identity.name?.trim() || email.split("@")[0],
        email,
        neonAuthUserId: identity.id,
        // This is not a usable password hash. Neon Auth owns credentials.
        passwordHash: "managed-by-neon-auth",
        studentProfile: { create: {} },
      },
    });
  } catch (error) {
    // Handle concurrent first sign-ins without creating duplicate app users.
    const racedIdentity = await prisma.user.findUnique({
      where: { neonAuthUserId: identity.id },
    });
    if (racedIdentity) {
      await ensureStudentProfile(racedIdentity.id);
      return racedIdentity;
    }

    const racedEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (racedEmail && !racedEmail.neonAuthUserId) {
      const mapped = await prisma.user.update({
        where: { id: racedEmail.id },
        data: { neonAuthUserId: identity.id },
      });
      await ensureStudentProfile(mapped.id);
      return mapped;
    }

    throw error;
  }
}
