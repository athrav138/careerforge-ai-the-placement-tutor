"use server";

import { auth } from "@/lib/auth/server";

export async function verifyEmail(email: string, otp: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const code = otp.trim();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Please provide a valid email address." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the 6-digit verification code." };
  }

  const { error } = await auth.emailOtp.verifyEmail({
    email: normalizedEmail,
    otp: code,
  });

  if (error) {
    return { error: error.message || "The verification code could not be accepted." };
  }

  return { success: true };
}

export async function resendVerification(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { error: "Please provide a valid email address." };
  }

  const { error } = await auth.emailOtp.sendVerificationOtp({
    email: normalizedEmail,
  });

  if (error) {
    return { error: error.message || "Unable to send a new code." };
  }

  return { success: true };
}
