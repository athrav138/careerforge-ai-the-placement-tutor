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
        assessment: {
          include: {
            questions: {
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
                    skill: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
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

    // Check if attempt is already completed
    if (attempt.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: "Assessment already completed.",
        redirect: `/dashboard/aptitude/results/${attemptId}`
      }, { status: 400 });
    }

    // Calculate remaining time
    const startedAt = new Date(attempt.startedAt);
    const durationMs = attempt.assessment.durationMinutes * 60 * 1000;
    const elapsedMs = Date.now() - startedAt.getTime();
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    const remainingSeconds = Math.floor(remainingMs / 1000);

    // Check if time has expired
    if (remainingSeconds <= 0) {
      // Auto-submit expired assessment
      await submitAssessment(attempt);
      return NextResponse.json({ 
        error: "Assessment time expired.",
        redirect: `/dashboard/aptitude/results/${attemptId}`
      }, { status: 400 });
    }

    // Create a map of answers by questionId
    const answerMap = new Map(
      attempt.answers.map(a => [a.questionId, a.selectedAnswer])
    );

    // Return safe question data with current answers
    const safeQuestions = attempt.assessment.questions.map((aq) => {
      const question = aq.question;
      const savedAnswer = answerMap.get(question.id);
      
      return {
        id: question.id,
        position: aq.position,
        question: question.question,
        options: [question.optionA, question.optionB, question.optionC, question.optionD],
        category: question.category,
        difficulty: question.difficulty,
        skill: question.skill?.name || null,
        selectedAnswer: savedAnswer || null,
      };
    });

    return NextResponse.json({
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        category: attempt.assessment.category,
        difficulty: attempt.assessment.difficulty,
        totalQuestions: attempt.assessment.totalQuestions,
        durationMinutes: attempt.assessment.durationMinutes,
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        remainingSeconds,
      },
      questions: safeQuestions,
    });
  } catch (error) {
    console.error("Error retrieving assessment:", error);
    return NextResponse.json({ error: "Failed to retrieve assessment." }, { status: 500 });
  }
}

// Helper function to submit expired assessment
async function submitAssessment(attempt: any) {
  try {
    // Get all questions in the assessment
    const assessmentQuestions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
      include: {
        question: true,
      },
    });

    // Get user's answers
    const userAnswers = await prisma.assessmentAnswer.findMany({
      where: { attemptId: attempt.id },
    });

    const answerMap = new Map(
      userAnswers.map(a => [a.questionId, a.selectedAnswer])
    );

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    // Calculate score
    for (const aq of assessmentQuestions) {
      const userAnswer = answerMap.get(aq.questionId);
      if (!userAnswer) {
        unansweredCount++;
      } else if (userAnswer === aq.question.correctAnswer) {
        correctCount++;
        // Update answer with correctness
        await prisma.assessmentAnswer.updateMany({
          where: {
            attemptId: attempt.id,
            questionId: aq.questionId,
          },
          data: { isCorrect: true },
        });
      } else {
        incorrectCount++;
        // Update answer with correctness
        await prisma.assessmentAnswer.updateMany({
          where: {
            attemptId: attempt.id,
            questionId: aq.questionId,
          },
          data: { isCorrect: false },
        });
      }
    }

    const totalQuestions = assessmentQuestions.length;
    const percentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const score = Math.round(percentage);

    // Update attempt
    await prisma.assessmentAttempt.update({
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
  } catch (error) {
    console.error("Error auto-submitting assessment:", error);
  }
}