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
    const attemptId = params.id;

    // Get the attempt with ownership verification
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: true,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                category: true,
                difficulty: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctAnswer: true,
                explanation: true,
                skill: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
    }

    // Verify ownership
    if (attempt.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Calculate category-wise performance
    const categoryPerformance: Record<string, { correct: number; total: number }> = {};
    const difficultyPerformance: Record<string, { correct: number; total: number }> = {};

    // Calculate performance from answers
    for (const answer of attempt.answers) {
      const question = answer.question;

      // Initialize category performance
      if (!categoryPerformance[question.category]) {
        categoryPerformance[question.category] = { correct: 0, total: 0 };
      }
      categoryPerformance[question.category].total++;

      // Initialize difficulty performance
      if (!difficultyPerformance[question.difficulty]) {
        difficultyPerformance[question.difficulty] = { correct: 0, total: 0 };
      }
      difficultyPerformance[question.difficulty].total++;

      if (answer.isCorrect) {
        categoryPerformance[question.category].correct++;
        difficultyPerformance[question.difficulty].correct++;
      }
    }

    // Calculate category percentages
    const categoryResults = Object.entries(categoryPerformance).map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    // Calculate difficulty percentages
    const difficultyResults = Object.entries(difficultyPerformance).map(([difficulty, data]) => ({
      difficulty,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    // Return safe result information with detailed answers
    return NextResponse.json({
      result: {
        attemptId: attempt.id,
        assessment: {
          id: attempt.assessment.id,
          title: attempt.assessment.title,
          category: attempt.assessment.category,
          difficulty: attempt.assessment.difficulty,
        },
        score: attempt.score,
        percentage: attempt.percentage,
        totalQuestions: attempt.assessment.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        unanswered: attempt.unanswered,
        categoryPerformance: categoryResults,
        difficultyPerformance: difficultyResults,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      },
      answers: attempt.answers.map((answer) => ({
        questionId: answer.question.id,
        question: answer.question.question,
        options: [answer.question.optionA, answer.question.optionB, answer.question.optionC, answer.question.optionD],
        category: answer.question.category,
        difficulty: answer.question.difficulty,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.question.correctAnswer,
        isCorrect: answer.isCorrect,
        explanation: answer.question.explanation,
        skill: answer.question.skill?.name || null,
      })),
    });
  } catch (error) {
    console.error("Error retrieving result:", error);
    return NextResponse.json({ error: "Failed to retrieve result." }, { status: 500 });
  }
}