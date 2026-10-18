import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ skillId: string }> }
) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { skillId } = params;

    const skillPerformance = await prisma.skillPerformance.findUnique({
      where: {
        studentProfileId_skillId: {
          studentProfileId: user.studentProfileId,
          skillId,
        },
      },
      include: {
        skill: true,
        studentProfile: { include: { targetCareer: true } },
      },
    });

    if (!skillPerformance) {
      return NextResponse.json({ error: "Skill performance not found" }, { status: 404 });
    }

    const careerRelevance =
      skillPerformance.studentProfile.targetCareer?.requiredSkills.includes(skillId)
        ? "HIGH"
        : "LOW";

    return NextResponse.json({
      skill: skillPerformance.skill,
      accuracy: skillPerformance.accuracy,
      totalQuestions: skillPerformance.totalQuestions,
      attemptedQuestions: skillPerformance.attemptedQuestions,
      correctAnswers: skillPerformance.correctAnswers,
      incorrectAnswers: skillPerformance.incorrectAnswers,
      classification: skillPerformance.classification,
      priority: skillPerformance.priority,
      assessmentCount: skillPerformance.assessmentCount,
      lastAssessedAt: skillPerformance.lastAssessedAt,
      careerRelevance,
    });
  } catch (error) {
    console.error("Error fetching skill detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
