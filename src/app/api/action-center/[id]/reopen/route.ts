import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const where = { id, studentProfileId: user.studentProfileId };
    const result = await prisma.careerAction.updateMany({ where, data: { completed: false, completedAt: null } });
    if (!result.count) return NextResponse.json({ error: "Action not found." }, { status: 404 });
    const action = await prisma.careerAction.findFirst({ where });
    if (!action) return NextResponse.json({ error: "Action not found." }, { status: 404 });
    return NextResponse.json({ action });
  } catch {
    return NextResponse.json({ error: "Unable to reopen action." }, { status: 500 });
  }
}