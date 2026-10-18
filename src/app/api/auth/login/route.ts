import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getAppUserForIdentity, toClientUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    const { data, error } = await auth.signIn.email({ email, password });
    if (error || !data?.user) {
      return NextResponse.json({ error: error?.message || "Invalid email or password." }, { status: 401 });
    }

    const user = await getAppUserForIdentity(data.user);
    if (!user) {
      return NextResponse.json({ error: "Unable to load your student profile." }, { status: 500 });
    }

    return NextResponse.json({ user: toClientUser(user) });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Unable to log in." }, { status: 500 });
  }
}
