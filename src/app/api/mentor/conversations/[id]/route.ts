import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

async function getOwnedConversation(id: string, studentProfileId: string) {
  const conversation = await prisma.mentorConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!conversation) return { response: NextResponse.json({ error: "Conversation not found." }, { status: 404 }) };
  if (conversation.studentProfileId !== studentProfileId) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { conversation };
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = await getOwnedConversation(params.id, user.studentProfileId);
  return result.response ?? NextResponse.json({ conversation: result.conversation });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const result = await getOwnedConversation(params.id, user.studentProfileId);
  if (result.response) return result.response;
  await prisma.mentorConversation.delete({ where: { id: result.conversation!.id } });
  return NextResponse.json({ success: true });
}
