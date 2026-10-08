"use client";

import { createClient } from "@/lib/supabase/client";

export type UserSession = {
  name: string;
  email: string;
  onboardingComplete: boolean;
};

export async function getSession(): Promise<UserSession | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as { user?: UserSession };
        if (data.user) return data.user;
      }
    } catch (error) {
      console.error("Failed to fetch /api/auth/me", error);
    }

    return {
      name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
      email: session.user.email || "",
      onboardingComplete: false,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Keep logout navigation responsive even if cleanup fails
  }
}

export async function isAuthenticated() {
  return Boolean(await getSession());
}
