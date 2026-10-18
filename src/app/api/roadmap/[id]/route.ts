import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { id: params.id, studentProfileId: user.studentProfileId ?? "" },
      include: { careerRole: { select: { id: true, title: true } }, tasks: { orderBy: { createdAt: "asc" } } },
    });
    if (!roadmap) return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
    return NextResponse.json({ roadmap });
  } catch {
    return NextResponse.json({ error: "Unable to load this roadmap." }, { status: 500 });
  }
}
