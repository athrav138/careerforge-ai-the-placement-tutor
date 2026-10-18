import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user || !user.studentProfileId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: params.id },
      include: {
        answers: {
          include: {
            question: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    if (attempt.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    if (attempt.status !== "COMPLETED") {
      return NextResponse.json({ error: "Attempt not completed." }, { status: 400 });
    }

    // Group answers by skill
    const skillMap = new Map<string, {
      skillId: string;
      skillName: string;
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      unansweredQuestions: number;
    }>();

    for (const answer of attempt.answers) {
      const skill = answer.question.skill;
      if (!skill) continue;

      let stats = skillMap.get(skill.id);
      if (!stats) {
        stats = {
          skillId: skill.id,
          skillName: skill.name,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          unansweredQuestions: 0,
        };
        skillMap.set(skill.id, stats);
      }

      stats.totalQuestions++;
      if (answer.isCorrect) {
        stats.correctAnswers++;
      } else if (answer.selectedAnswer === "") {
        stats.unansweredQuestions++;
      } else {
        stats.incorrectAnswers++;
      }
    }

    // Calculate percentages, classify, and determine priority
    const skills = Array.from(skillMap.values()).map((s) => {
      const percentage = s.totalQuestions > 0 ? (s.correctAnswers / s.totalQuestions) * 100 : 0;
      
      let classification = "WEAK";
      let priority = "LOW";

      if (percentage >= 80) {
        classification = "STRONG";
      } else if (percentage >= 50) {
        classification = "AVERAGE";
      } else {
        classification = "WEAK";
        if (percentage <= 25) {
          priority = "HIGH";
        } else {
          priority = "MEDIUM";
        }
      }

      return {
        ...s,
        percentage: Math.round(percentage),
        classification,
        priority,
      };
    });

    // Career and Resume overlap integration
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { id: user.studentProfileId },
      include: {
        careerAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            analysis: true,
          }
        }
      }
    });

    const careerMissingSkills = studentProfile?.careerAnalyses[0]?.missingSkills || [];
    const resumeMissingSkills = studentProfile?.resumes[0]?.analysis?.missingSkills || [];
    
    // Convert to lowercase for matching
    const careerMissingLower = new Set(careerMissingSkills.map(s => s.toLowerCase()));
    const resumeMissingLower = new Set(resumeMissingSkills.map(s => s.toLowerCase()));

    const strongSkills = skills.filter((s) => s.classification === "STRONG");
    const averageSkills = skills.filter((s) => s.classification === "AVERAGE");
    const weakSkills = skills.filter((s) => s.classification === "WEAK").map(s => {
      const isCareerGap = careerMissingLower.has(s.skillName.toLowerCase());
      const isResumeGap = resumeMissingLower.has(s.skillName.toLowerCase());
      return {
        ...s,
        isCareerGap,
        isResumeGap,
        isPriorityGap: isCareerGap || isResumeGap
      };
    });

    return NextResponse.json({
      attemptId: attempt.id,
      overallPercentage: attempt.percentage,
      skills,
      strongSkills,
      averageSkills,
      weakSkills,
    });

  } catch (error) {
    console.error("Error retrieving skill analysis:", error);
    return NextResponse.json({ error: "Failed to retrieve skill analysis." }, { status: 500 });
  }
}
