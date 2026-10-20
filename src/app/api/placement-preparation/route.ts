import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getPlacementPreparation } from "@/lib/placement-preparation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const preparation = await getPlacementPreparation(user.studentProfileId);
    return NextResponse.json(preparation, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Unable to load placement preparation:", error);
    return NextResponse.json({ error: "Unable to load placement preparation." }, { status: 500 });
  }
}
