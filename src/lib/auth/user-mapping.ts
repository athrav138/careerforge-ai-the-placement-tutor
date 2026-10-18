import "server-only";

import { prisma } from "@/lib/prisma";

type AuthIdentity = {
  id: string;
  email: string;
  emailVerified: boolean;
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
 * Keep existing CareerForge User/StudentProfile IDs stable. A legacy record
 * is linked only after Neon Auth confirms the identity's email is verified.
 */
export async function ensureAppUser(identity: AuthIdentity) {
  const email = identity.email?.trim().toLowerCase();
  if (!identity.id || !email) {
    throw new Error("Neon Auth returned a user without an ID or email.");
  }
  if (identity.emailVerified !== true) {
    throw new Error("Please verify your email address before continuing.");
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
    const created = await prisma.user.create({
      data: {
        name: identity.name?.trim() || email.split("@")[0],
        email,
        neonAuthUserId: identity.id,
        // Neon Auth owns credentials; this field is not used to authenticate.
        passwordHash: "managed-by-neon-auth",
        studentProfile: { create: {} },
      },
    });
    return created;
  } catch (error) {
    const racedIdentity = await prisma.user.findUnique({
      where: { neonAuthUserId: identity.id },
    });
    if (racedIdentity) {
      await ensureStudentProfile(racedIdentity.id);
      return racedIdentity;
    }
    throw error;
  }
}
