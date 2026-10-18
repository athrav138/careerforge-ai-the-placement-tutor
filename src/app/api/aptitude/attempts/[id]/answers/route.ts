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
    const body = await request.json();
    const { questionId, selectedAnswer } = body;

    // Validate inputs
    if (!questionId || !selectedAnswer) {
      return NextResponse.json({ error: "Question ID and selected answer are required." }, { status: 400 });
    }

    if (!['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      return NextResponse.json({ error: "Invalid answer. Must be A, B, C, or D." }, { status: 400 });
    }

    // Get the attempt with ownership verification
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: true,
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

    // Check if attempt is still in progress
    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: "Assessment is not in progress." }, { status: 400 });
    }

    // Verify that the question belongs to this assessment
    const assessmentQuestion = attempt.assessment.questions.find(
      (aq) => aq.questionId === questionId
    );

    if (!assessmentQuestion) {
      return NextResponse.json({ error: "Question not found in this assessment." }, { status: 404 });
    }

    // Upsert the answer using the unique constraint
    await prisma.assessmentAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        selectedAnswer,
        isCorrect: false,
      },
      update: {
        selectedAnswer,
        isCorrect: false,
      },
    });

    return NextResponse.json({
      success: true,
      answer: {
        questionId,
        selectedAnswer,
      },
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json({ error: "Failed to submit answer." }, { status: 500 });
  }
}