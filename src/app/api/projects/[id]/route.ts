import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { careerRole: { select: { title: true } }, skillRelations: { select: { name: true } } },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const recommendation = await prisma.projectRecommendation.findUnique({
    where: { studentProfileId_projectId: { studentProfileId: user.studentProfileId, projectId: project.id } },
  });
  return NextResponse.json({ project, recommendation });
}
