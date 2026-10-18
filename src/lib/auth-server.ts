import "server-only";

import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/auth/user-mapping";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  studentProfileId: string | null;
};

export async function getAppUserForIdentity(identity: {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
} | null | undefined): Promise<SafeUser | null> {
  if (!identity?.id || !identity.email) return null;

  const user = await ensureAppUser(identity);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, profileCompletion: true },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    onboardingComplete: (profile?.profileCompletion ?? 0) > 0,
    studentProfileId: profile?.id ?? null,
  };
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const { data, error } = await auth.getSession();
    if (error || !data?.user) return null;
    return await getAppUserForIdentity(data.user);
  } catch (error) {
    // Unverified email identities are intentionally not linked to app data.
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export function toClientUser(user: SafeUser) {
  return {
    name: user.name,
    email: user.email,
    onboardingComplete: user.onboardingComplete,
  };
}
