import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getAppUserForIdentity, toClientUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { data, error } = await auth.signUp.email({ name, email, password });
    if (error || !data?.user) {
      return NextResponse.json({ error: error?.message || "Unable to create account." }, { status: 400 });
    }

    const user = await getAppUserForIdentity(data.user);
    if (!user) {
      return NextResponse.json({ error: "Account created, but the student profile could not be loaded." }, { status: 500 });
    }

    return NextResponse.json({ user: toClientUser(user) }, { status: 201 });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
