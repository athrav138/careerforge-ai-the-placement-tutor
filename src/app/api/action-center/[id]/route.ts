import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const result = await prisma.careerAction.deleteMany({ where: { id, studentProfileId: user.studentProfileId } });
    if (!result.count) return NextResponse.json({ error: "Action not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete action." }, { status: 500 });
  }
}