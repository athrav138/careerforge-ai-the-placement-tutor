import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(
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
        assessment: {
          include: {
            questions: {
              include: {
                question: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Assessment attempt not found." }, { status: 404 });
    }

    // Verify ownership
    if (attempt.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Check if attempt is already submitted
    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({ error: "Assessment already completed." }, { status: 400 });
    }

    // Get all questions in the assessment
    const assessmentQuestions = attempt.assessment.questions;

    // Get user's answers
    const userAnswers = attempt.answers;

    const answerMap = new Map(
      userAnswers.map(a => [a.questionId, a.selectedAnswer])
    );

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    // Category-wise performance
    const categoryPerformance: Record<string, { correct: number; total: number }> = {};

    // Difficulty-wise performance
    const difficultyPerformance: Record<string, { correct: number; total: number }> = {};

    // Calculate score and update answers with correctness
    for (const aq of assessmentQuestions) {
      const question = aq.question;
      const userAnswer = answerMap.get(question.id);

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

      if (!userAnswer) {
        unansweredCount++;
      } else if (userAnswer === question.correctAnswer) {
        correctCount++;
        categoryPerformance[question.category].correct++;
        difficultyPerformance[question.difficulty].correct++;

        // Update answer with correctness
        await prisma.assessmentAnswer.updateMany({
          where: {
            attemptId: attempt.id,
            questionId: question.id,
          },
          data: { isCorrect: true },
        });
      } else {
        incorrectCount++;
        // Update answer with correctness
        await prisma.assessmentAnswer.updateMany({
          where: {
            attemptId: attempt.id,
            questionId: question.id,
          },
          data: { isCorrect: false },
        });
      }
    }

    const totalQuestions = assessmentQuestions.length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const score = Math.round(percentage);

    // Update attempt with final results
    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
        percentage,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        unanswered: unansweredCount,
      },
    });

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

    // Return safe result information
    return NextResponse.json({
      success: true,
      result: {
        attemptId: updatedAttempt.id,
        score: updatedAttempt.score,
        percentage: updatedAttempt.percentage,
        totalQuestions,
        correctAnswers: updatedAttempt.correctAnswers,
        incorrectAnswers: updatedAttempt.incorrectAnswers,
        unanswered: updatedAttempt.unanswered,
        categoryPerformance: categoryResults,
        difficultyPerformance: difficultyResults,
        completedAt: updatedAttempt.completedAt,
        status: updatedAttempt.status,
      },
    });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json({ error: "Failed to submit assessment." }, { status: 500 });
  }
}