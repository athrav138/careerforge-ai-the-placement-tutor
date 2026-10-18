"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getNeonAuth, getCurrentUser } from "@/lib/auth-server";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!validEmail(email) || !password) return { error: "Enter a valid email and password." };

  const { error } = await getNeonAuth().signIn.email({ email, password });
  if (error) {
    const safeError = error as { status?: number; code?: string };
    console.warn("Neon Auth sign-in rejected", { status: safeError.status, code: safeError.code });
    return { error: "Email or password is incorrect." };
  }

  // The Auth SDK writes the new session cookie on the action response. Resolve
  // the session and lazily link its application profile on the next request.
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || name.length > 120) return { error: "Enter your name (up to 120 characters)." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const { error } = await getNeonAuth().signUp.email({
    email,
    name,
    password,
    callbackURL: "/dashboard",
  });
  if (error) {
    const safeError = error as { status?: number; code?: string; message?: string };
    const requestHeaders = await headers();
    const rawOrigin = requestHeaders.get("origin");
    const rawRequestId = requestHeaders.get("x-request-id");
    let requestOrigin: string | null = null;
    try {
      requestOrigin = rawOrigin ? new URL(rawOrigin).origin : null;
    } catch {
      // Keep malformed, user-controlled origin text out of logs.
    }
    console.warn("Neon Auth sign-up rejected", {
      timestampUtc: new Date().toISOString(),
      method: "POST",
      path: "/sign-up/email",
      origin: requestOrigin,
      requestId: rawRequestId && /^[A-Za-z0-9._:-]{1,128}$/.test(rawRequestId) ? rawRequestId : null,
      status: safeError.status,
      sdkCode: safeError.code,
      providerMessage: typeof safeError.message === "string"
        ? safeError.message
          .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
          .replace(/\b(?:eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+)\b/g, "[REDACTED_TOKEN]")
          .slice(0, 240)
        : null,
    });
    return { error: "Unable to create your account. Please try again or sign in." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { message: "Your account was created. Verify your email if prompted, then sign in." };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Enter a valid email address." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return { error: "Password recovery is not configured for this site." };

  try {
    const redirectTo = new URL("/reset-password", siteUrl).toString();
    const { error } = await getNeonAuth().requestPasswordReset({ email, redirectTo });
    if (error) return { error: "Password reset could not be started. Please try again later." };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { error: "Password reset could not be started. Please try again later." };
  }

  return { message: "If an account exists for that email, a reset link will arrive shortly." };
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Your reset link is invalid or has expired. Request a new one." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const { error } = await getNeonAuth().resetPassword({ newPassword: password, token });
  if (error) return { error: "Unable to update your password. Request a new reset link and try again." };

  revalidatePath("/", "layout");
  return { message: "Your password has been updated. You can now sign in." };
}
