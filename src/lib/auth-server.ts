import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

let neonAuthInstance: ReturnType<typeof createNeonAuth> | undefined;

export function getNeonAuth() {
  if (neonAuthInstance) return neonAuthInstance;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl) {
    throw new Error("Neon Auth is not configured. Set NEON_AUTH_BASE_URL.");
  }
  if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must contain at least 32 characters.");
  }

  neonAuthInstance = createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret },
  });
  return neonAuthInstance;
}

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  studentProfileId: string | null;
};

type NeonIdentity = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

/** Link Neon Auth identities to app profiles without allowing unverified email claims to claim an existing profile. */
export async function syncNeonAuthUser(authUser: NeonIdentity): Promise<void> {
  const linkedUser = await prisma.user.findUnique({
    where: { neonAuthUserId: authUser.id },
    select: { id: true },
  });
  if (linkedUser) return;

  const existingUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, neonAuthUserId: true },
  });

  if (existingUser) {
    if (!authUser.emailVerified) {
      throw new Error("Verify your email before linking it to an existing CareerForge profile.");
    }
    if (existingUser.neonAuthUserId && existingUser.neonAuthUserId !== authUser.id) {
      throw new Error("This CareerForge profile is linked to another authentication identity.");
    }

    try {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { neonAuthUserId: authUser.id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrentLink = await prisma.user.findUnique({
          where: { neonAuthUserId: authUser.id },
          select: { id: true },
        });
        if (concurrentLink) return;
      }
      throw error;
    }
    return;
  }

  try {
    await prisma.user.create({
      data: {
        email: authUser.email,
        neonAuthUserId: authUser.id,
        name: authUser.name || authUser.email.split("@")[0],
        passwordHash: null,
        studentProfile: { create: {} },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrentLink = await prisma.user.findUnique({
        where: { neonAuthUserId: authUser.id },
        select: { id: true },
      });
      if (concurrentLink) return;
    }
    throw error;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const { data: session } = await getNeonAuth().getSession({ query: {} });
    const authUser = session?.user;
    if (!authUser?.email) return null;

    // Best-effort sync — a slow or failing DB sync must NOT invalidate the session.
    try {
      await syncNeonAuthUser({
        id: authUser.id,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        name: authUser.name,
      });
    } catch (syncError) {
      console.warn("syncNeonAuthUser failed (non-fatal):", syncError);
    }

    const user = await prisma.user.findUnique({
      where: { neonAuthUserId: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        studentProfile: { select: { id: true, profileCompletion: true } },
      },
    });
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      onboardingComplete: (user.studentProfile?.profileCompletion ?? 0) > 0,
      studentProfileId: user.studentProfile?.id ?? null,
    };
  } catch (error) {
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
