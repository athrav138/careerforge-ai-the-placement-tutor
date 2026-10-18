"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export type UserSession = {
  name: string;
  email: string;
  onboardingComplete: boolean;
};

export async function getSession(): Promise<UserSession | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { user?: UserSession | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const { error } = await authClient.signOut({});
  if (error) throw error;
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}
