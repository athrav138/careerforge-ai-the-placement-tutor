"use client";

import { authClient } from "@/lib/auth/client";

export type UserSession = {
  name: string;
  email: string;
  onboardingComplete: boolean;
};

export async function getSession(): Promise<UserSession | null> {
  try {
    const { data, error } = await authClient.getSession();
    if (error || !data?.session || !data.user?.email) return null;

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const result = (await response.json()) as { user?: UserSession };
        if (result.user) return result.user;
      }
    } catch (error) {
      console.error("Failed to fetch /api/auth/me", error);
    }

    return {
      name: data.user.name || data.user.email.split("@")[0] || "User",
      email: data.user.email,
      onboardingComplete: false,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    await authClient.signOut();
  } catch {
    // Keep logout navigation responsive even if cleanup fails.
  }
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}
