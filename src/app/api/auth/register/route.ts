import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

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

    const { error } = await auth.signUp.email({ name, email, password });
    if (error) {
      return NextResponse.json({ error: error.message || "Unable to create account." }, { status: 400 });
    }

    const { error: otpError } = await auth.emailOtp.sendVerificationOtp({ email });
    if (otpError) {
      console.error("Neon Auth verification OTP send failed:", otpError);
      return NextResponse.json({
        verificationRequired: true,
        email,
        error: "Account creation was attempted, but the verification code could not be sent. Try signing in or resending the code.",
      }, { status: 201 });
    }

    return NextResponse.json({
      verificationRequired: true,
      email,
      message: "Check your email for the verification code.",
    }, { status: 201 });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
