"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getAppUserForIdentity } from "@/lib/auth-server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const { data, error } = await auth.signIn.email({ email, password });
  if (error || !data?.user) {
    return { error: error?.message || "Invalid email or password." };
  }

  try {
    await getAppUserForIdentity(data.user);
  } catch (error) {
    console.error("CareerForge user mapping failed after Neon Auth login:", error);
    return { error: "Signed in, but your student profile could not be loaded. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password) {
    return { error: "Please complete all fields." };
  }
  if (!email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { data, error } = await auth.signUp.email({ name, email, password });
  if (error || !data?.user) {
    return { error: error?.message || "Unable to create account." };
  }

  try {
    await getAppUserForIdentity(data.user);
  } catch (error) {
    console.error("CareerForge user mapping failed after Neon Auth signup:", error);
    return { error: "Your account was created, but your student profile could not be prepared. Please sign in again." };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
