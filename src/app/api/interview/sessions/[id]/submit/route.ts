import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { collectUnifiedGaps, refreshRoadmapWithNewGaps } from "@/lib/roadmap";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.interviewSession.findUnique({
      where: { id: params.id },
      include: {
        answers: {
          include: {
            evaluation: true,
            interviewQuestion: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({ error: "Session is already completed" }, { status: 400 });
    }

    // Calculate scores
    let totalScore = 0;
    let evalCount = 0;

    const categoryStats: Record<string, { total: number, count: number }> = {
      TECHNICAL: { total: 0, count: 0 },
      HR: { total: 0, count: 0 },
      RESUME_BASED: { total: 0, count: 0 }
    };

    let totalClarity = 0;
    let totalProfessionalism = 0;

    // We will collect weak skills to optionally add to the roadmap
    const weakSkillsToFlag: string[] = [];

    for (const ans of session.answers) {
      if (ans.evaluation) {
        const ev = ans.evaluation;
        totalScore += ev.score;
        evalCount++;

        totalClarity += ev.clarity;
        totalProfessionalism += ev.professionalism;

        const category =
          ans.interviewQuestion?.category ||
          (session.interviewType === "HR"
            ? "HR"
            : session.interviewType === "RESUME_BASED"
              ? "RESUME_BASED"
              : "TECHNICAL");
        
        if (category === "TECHNICAL") {
          categoryStats.TECHNICAL.total += ev.score;
          categoryStats.TECHNICAL.count++;
          
          // Flag weak skills for Roadmap Integration
          if (ev.score < 50 && ans.interviewQuestion?.skillId) {
            weakSkillsToFlag.push(ans.interviewQuestion.skillId);
          }
        } else if (category === "HR" || category === "BEHAVIORAL") {
          categoryStats.HR.total += ev.score;
          categoryStats.HR.count++;
        } else if (category === "RESUME_BASED") {
          categoryStats.RESUME_BASED.total += ev.score;
          categoryStats.RESUME_BASED.count++;
        }
      }
    }

    // Convert out of 10 to out of 100
    const finalScore = evalCount > 0 ? totalScore / evalCount : 0;
    const technicalScore = categoryStats.TECHNICAL.count > 0 ? categoryStats.TECHNICAL.total / categoryStats.TECHNICAL.count : null;
    const hrScore = categoryStats.HR.count > 0 ? categoryStats.HR.total / categoryStats.HR.count : null;
    const resumeScore = categoryStats.RESUME_BASED.count > 0 ? categoryStats.RESUME_BASED.total / categoryStats.RESUME_BASED.count : null;
    
    const commsScore = evalCount > 0 ? ((totalClarity + totalProfessionalism) / (evalCount * 2)) * 10 : null;

    const updatedSession = await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        score: finalScore,
        technicalScore,
        hrScore,
        resumeScore,
        communicationScore: commsScore
      }
    });

    // Roadmap Integration
    if (weakSkillsToFlag.length > 0) {
      // Find the active roadmap
      const roadmap = await prisma.learningRoadmap.findFirst({
        where: { studentProfileId: user.studentProfileId },
        orderBy: { updatedAt: "desc" }
      });

      if (roadmap) {
        // Fetch the skill names
        const skills = await prisma.skill.findMany({
          where: { id: { in: weakSkillsToFlag } }
        });

        const newTasks = skills.map(s => ({
          roadmapId: roadmap.id,
          title: `Review interview feedback: ${s.name}`,
          description: `Your recent interview identified ${s.name} as a weak area. Review the concepts and practice.`,
          category: "PRACTICE",
          difficulty: "MEDIUM",
          estimatedMinutes: 60,
          source: "APTITUDE_WEAK", // We can use APTITUDE_WEAK or CAREER_GAP as an existing source, or add INTERVIEW_GAP if we updated the schema. Schema doesn't have INTERVIEW_GAP, so reusing CAREER_GAP.
          priority: "HIGH",
          skillId: s.id
        }));

        // Insert tasks
        await prisma.roadmapTask.createMany({
          data: newTasks.map(t => ({ ...t, source: "CAREER_GAP" }))
        });

        // Recalculate roadmap progress
        const tasks = await prisma.roadmapTask.findMany({ where: { roadmapId: roadmap.id } });
        const completed = tasks.filter(t => t.status === "COMPLETED").length;
        const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
        await prisma.learningRoadmap.update({
          where: { id: roadmap.id },
          data: { progress, status: progress === 100 ? "COMPLETED" : "IN_PROGRESS" }
        });
      }
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    console.error("Interview submit error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
