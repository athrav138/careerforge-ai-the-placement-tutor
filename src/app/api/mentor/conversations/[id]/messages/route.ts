import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { GeminiConfigurationError } from "@/lib/gemini";
import { buildMentorContext } from "@/lib/mentor/context";
import { GeminiMentorError, getMentorResponse } from "@/lib/mentor/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 2_000) return NextResponse.json({ error: "Message must be between 1 and 2,000 characters." }, { status: 400 });
  const conversation = await prisma.mentorConversation.findUnique({ where: { id: params.id }, include: { messages: { orderBy: { createdAt: "desc" }, take: 10 } } });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  if (conversation.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.mentorMessage.create({ data: { conversationId: conversation.id, role: "USER", content } });
    await tx.mentorConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date(), title: conversation.title ?? content.slice(0, 72) } });
    return message;
  });
  try {
    const context = await buildMentorContext(user.studentProfileId);
    const history = [...conversation.messages].reverse().map((message) => ({ role: message.role === "ASSISTANT" ? "ASSISTANT" as const : "USER" as const, content: message.content }));
    const mentorResponse = await getMentorResponse(context, history, content);
    const assistantMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.mentorMessage.create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: mentorResponse.message, actions: mentorResponse.actions } });
      await tx.mentorConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
      return message;
    });
    return NextResponse.json({ userMessage, assistantMessage, actions: mentorResponse.actions });
  } catch (error) {
    console.error("Unable to generate mentor response:", error);
    if (error instanceof GeminiConfigurationError) return NextResponse.json({ error: "AI mentor is not configured." }, { status: 503 });
    if (error instanceof GeminiMentorError) return NextResponse.json({ error: "The AI mentor could not respond right now. Your message was saved." }, { status: 502 });
    return NextResponse.json({ error: "Unable to prepare personalized mentor context. Your message was saved." }, { status: 500 });
  }
}
