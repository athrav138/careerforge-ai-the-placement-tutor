import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  evaluateAnswerWithGemini,
  GeminiConfigurationError,
  GeminiEvaluationError,
} from "@/lib/gemini";

const MAX_ANSWER_LENGTH = 10_000;

function isAnswerRequest(value: unknown): value is { answerId: string; answerText: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).answerId === "string" &&
    typeof (value as Record<string, unknown>).answerText === "string"
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (!isAnswerRequest(body)) {
      return NextResponse.json(
        { error: "answerId and answerText are required." },
        { status: 400 }
      );
    }

    const answerId = body.answerId.trim();
    const answerText = body.answerText.trim();
    if (!answerId || !answerText || answerText.length > MAX_ANSWER_LENGTH) {
      return NextResponse.json(
        { error: `answerText must contain 1 to ${MAX_ANSWER_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const session = await prisma.interviewSession.findFirst({
      where: {
        id: params.id,
        studentProfileId: user.studentProfileId,
      },
      select: {
        id: true,
        status: true,
        interviewType: true,
        difficulty: true,
        targetRole: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }
    if (!["STARTED", "IN_PROGRESS"].includes(session.status)) {
      return NextResponse.json(
        { error: "This interview session is no longer active." },
        { status: 409 }
      );
    }

    const answerRecord = await prisma.interviewAnswer.findFirst({
      where: { id: answerId, interviewSessionId: session.id },
      select: {
        id: true,
        questionText: true,
        interviewQuestion: {
          select: {
            category: true,
            difficulty: true,
            expectedPoints: true,
            skill: { select: { name: true } },
          },
        },
      },
    });
    if (!answerRecord) {
      return NextResponse.json(
        { error: "Interview question not found in this session." },
        { status: 404 }
      );
    }

    const evaluation = await evaluateAnswerWithGemini(
      answerRecord.questionText,
      answerText,
      {
        targetRole: session.targetRole ?? "General",
        category: answerRecord.interviewQuestion?.category ?? session.interviewType,
        difficulty: answerRecord.interviewQuestion?.difficulty ?? session.difficulty,
        expectedPoints: answerRecord.interviewQuestion?.expectedPoints ?? null,
        skill: answerRecord.interviewQuestion?.skill?.name ?? null,
      }
    );

    const persisted = await prisma.$transaction(async (transaction) => {
      const activeSession = await transaction.interviewSession.updateMany({
        where: {
          id: session.id,
          studentProfileId: user.studentProfileId,
          status: { in: ["STARTED", "IN_PROGRESS"] },
        },
        data: { status: "IN_PROGRESS" },
      });
      if (activeSession.count !== 1) {
        return null;
      }

      const answer = await transaction.interviewAnswer.update({
        where: { id: answerRecord.id },
        data: { answerText },
        select: { id: true, questionText: true, answerText: true },
      });
      const savedEvaluation = await transaction.interviewEvaluation.upsert({
        where: { interviewAnswerId: answer.id },
        create: {
          interviewAnswerId: answer.id,
          score: evaluation.overallScore * 10,
          relevance: evaluation.relevance,
          technicalAccuracy: evaluation.technicalAccuracy,
          completeness: evaluation.completeness,
          clarity: evaluation.clarity,
          professionalism: evaluation.professionalism,
          feedback: evaluation.feedback,
          improvements: evaluation.improvements,
        },
        update: {
          score: evaluation.overallScore * 10,
          relevance: evaluation.relevance,
          technicalAccuracy: evaluation.technicalAccuracy,
          completeness: evaluation.completeness,
          clarity: evaluation.clarity,
          professionalism: evaluation.professionalism,
          feedback: evaluation.feedback,
          improvements: evaluation.improvements,
        },
      });

      return { answer, evaluation: savedEvaluation };
    });

    if (!persisted) {
      return NextResponse.json(
        { error: "This interview session is no longer active." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      answer: persisted.answer,
      evaluation: {
        relevance: persisted.evaluation.relevance,
        technicalAccuracy: persisted.evaluation.technicalAccuracy,
        completeness: persisted.evaluation.completeness,
        clarity: persisted.evaluation.clarity,
        professionalism: persisted.evaluation.professionalism,
        overallScore: persisted.evaluation.score / 10,
        feedback: persisted.evaluation.feedback,
        improvements: persisted.evaluation.improvements,
      },
    });
  } catch (error) {
    console.error("Interview answer evaluation failed:", error);
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json(
        { error: "Interview evaluation is temporarily unavailable." },
        { status: 503 }
      );
    }
    if (error instanceof GeminiEvaluationError) {
      return NextResponse.json(
        { error: "The AI evaluator could not return a valid evaluation." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Unable to save this interview answer." },
      { status: 500 }
    );
  }
}
