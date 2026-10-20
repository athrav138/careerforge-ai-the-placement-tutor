import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { generateActions } from "@/lib/action-center";

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    // Generate actions scoped to the authenticated student profile.
    // The helper MUST associate each created careerAction with `user.studentProfileId`.
    // In case of a regression we fail fast to avoid orphaned actions.
    const actions = await generateActions(user.studentProfileId);
    if (actions.some((a: any) => a.studentProfileId && a.studentProfileId !== user.studentProfileId)) {
      console.error("generateActions returned actions with mismatched studentProfileId");
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Unable to generate actions:", error);
    return NextResponse.json({ error: "Unable to generate actions." }, { status: 500 });
  }
}
