import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";
import { buildReadinessHistoryWhere } from "@/lib/readiness-analytics";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.studentProfileId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [snapshots, current] = await Promise.all([
      prisma.readinessScore.findMany({
        where: buildReadinessHistoryWhere(user.studentProfileId),
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, overallScore: true },
      }),
      calculateReadiness(user.studentProfileId),
    ]);
    return NextResponse.json({
      history: snapshots.map((snapshot) => ({ date: snapshot.createdAt.toISOString(), readiness: snapshot.overallScore })),
      current: {
        metrics: current.metrics,
        weakSkillCount: current.weakSkillCount,
        weakSkillCountAvailable: current.weakSkillCountAvailable,
        computedAt: current.computedAt,
      },
    });
  } catch (error) {
    console.error("Unable to load readiness history:", error);
    return NextResponse.json({ error: "Unable to load readiness history." }, { status: 500 });
  }
}
