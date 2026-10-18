import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { isProjectRecommendationStatus } from "@/lib/projects";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const recommendation = await prisma.projectRecommendation.findUnique({
    where: { id: params.id },
    include: { project: { include: { careerRole: { select: { title: true } }, skillRelations: { select: { name: true } } } } },
  });
  if (!recommendation) return NextResponse.json({ error: "Project recommendation not found." }, { status: 404 });
  if (recommendation.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ recommendation });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !isProjectRecommendationStatus(body.status)) {
    return NextResponse.json({ error: "A valid project status is required." }, { status: 400 });
  }
  const repositoryUrl = typeof body.repositoryUrl === "string" ? body.repositoryUrl.trim() || null : null;
  const demoUrl = typeof body.demoUrl === "string" ? body.demoUrl.trim() || null : null;
  const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 2_000) || null : null;

  const recommendation = await prisma.projectRecommendation.findUnique({
    where: { id: params.id },
    include: { project: { select: { skillRelations: { select: { name: true } } } } },
  });
  if (!recommendation) return NextResponse.json({ error: "Project recommendation not found." }, { status: 404 });
  if (recommendation.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const updated = await prisma.projectRecommendation.update({
    where: { id: recommendation.id },
    data: {
      status: body.status,
      repositoryUrl,
      demoUrl,
      summary,
      startedAt: body.status === "RECOMMENDED" ? null : recommendation.startedAt ?? now,
      completedAt: body.status === "COMPLETED" ? now : null,
      skillsDemonstrated: body.status === "COMPLETED" ? recommendation.project.skillRelations.map((skill) => skill.name) : recommendation.skillsDemonstrated,
    },
    include: { project: { include: { careerRole: { select: { title: true } }, skillRelations: { select: { name: true } } } } },
  });
  return NextResponse.json({ recommendation: updated });
}
