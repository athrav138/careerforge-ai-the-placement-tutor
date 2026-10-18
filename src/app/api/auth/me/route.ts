import { NextResponse } from "next/server";
import { getCurrentUser, toClientUser } from "@/lib/auth-server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ user: toClientUser(user) }, { headers: { "Cache-Control": "no-store" } });
}
