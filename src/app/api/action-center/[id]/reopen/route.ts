import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const action = await prisma.careerAction.findUnique({ where: { id: params.id } });
  if (!action) return NextResponse.json({ error: "Action not found." }, { status: 404 });
  if (action.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ action: await prisma.careerAction.update({ where: { id: action.id }, data: { completed: false, completedAt: null } }) });
}
