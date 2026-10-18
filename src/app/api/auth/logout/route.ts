import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function POST() {
  try {
    const { error } = await auth.signOut();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Unable to log out." }, { status: 500 });
  }
}
