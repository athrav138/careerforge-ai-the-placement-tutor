import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import {
  getPreparationOverview,
  getRoleSpecificPreparation,
  getLearningAndPractice,
  getEvidenceAndProgress,
} from "@/lib/placement-preparation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [overview, roleSpecific, learning, evidence] = await Promise.all([
      getPreparationOverview(user.studentProfileId),
      getRoleSpecificPreparation(user.studentProfileId),
      getLearningAndPractice(user.studentProfileId),
      getEvidenceAndProgress(user.studentProfileId),
    ]);

    return NextResponse.json({
      overview,
      roleSpecific,
      learning,
      evidence,
    });
  } catch (error) {
    console.error("Unable to load placement preparation:", error);
    return NextResponse.json(
      { error: "Unable to load placement preparation data." },
      { status: 500 }
    );
  }
}
