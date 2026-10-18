import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { generateActions, getActionCenter } from "@/lib/action-center";
import { postActionCenterResponse } from "@/lib/action-center-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json(await getActionCenter(user.studentProfileId)); } catch (error) { console.error("Unable to load action center:", error); return NextResponse.json({ error: "Unable to load action center." }, { status: 500 }); }
}

export async function POST() {
  return postActionCenterResponse(getCurrentUser, generateActions);
}
