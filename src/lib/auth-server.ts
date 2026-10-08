import "server-only";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  studentProfileId: string | null;
};

async function runQueryWithRetry<T>(queryFn: () => Promise<T>, timeoutMs = 8000): Promise<T> {
  const executeWithTimeout = () => {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Database query timed out")), timeoutMs);
    });
    return Promise.race([queryFn(), timeoutPromise]).finally(() => clearTimeout(timer));
  };

  try {
    return await executeWithTimeout();
  } catch (err: any) {
    const isConnectionError =
      err?.message?.includes("Closed") ||
      err?.message?.includes("PostgreSQL connection") ||
      err?.message?.includes("timed out");
    if (isConnectionError) {
      console.warn("Retrying database query after connection drop or timeout:", err?.message);
      return await executeWithTimeout();
    }
    throw err;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser || !authUser.email) return null;

    let user = await runQueryWithRetry(() =>
      prisma.user.findUnique({
        where: { supabaseUserId: authUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: {
            select: {
              id: true,
              profileCompletion: true,
            },
          },
        },
      })
    );

    if (!user) {
      const existingUser = await runQueryWithRetry(() =>
        prisma.user.findUnique({
          where: { email: authUser.email },
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                id: true,
                profileCompletion: true,
              },
            },
          },
        })
      );

      if (existingUser) {
        user = await runQueryWithRetry(() =>
          prisma.user.update({
            where: { id: existingUser.id },
            data: { supabaseUserId: authUser.id },
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  id: true,
                  profileCompletion: true,
                },
              },
            },
          })
        );
      } else {
        user = await runQueryWithRetry(() =>
          prisma.user.create({
            data: {
              email: authUser.email,
              supabaseUserId: authUser.id,
              name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              passwordHash: 'oauth',
              studentProfile: {
                create: {},
              },
            },
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  id: true,
                  profileCompletion: true,
                },
              },
            },
          })
        );
      }
    }

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
