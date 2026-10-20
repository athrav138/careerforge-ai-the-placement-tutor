import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { generateActions } from "@/lib/action-center";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ actions: await generateActions(user.studentProfileId) });
  } catch {
    return NextResponse.json({ error: "Unable to generate actions." }, { status: 500 });
  }
}