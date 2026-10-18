import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { recalculateRoadmap, ROADMAP_STATUSES, type RoadmapStatus } from "@/lib/roadmap";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = (await request.json()) as { status?: string };
    if (!body.status || !ROADMAP_STATUSES.includes(body.status as RoadmapStatus)) {
      return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
    }
    const task = await prisma.roadmapTask.findFirst({
      where: { id: params.id, roadmap: { studentProfileId: user.studentProfileId ?? "" } },
      select: { id: true, roadmapId: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    await prisma.roadmapTask.update({
      where: { id: task.id },
      data: { status: body.status, completedAt: body.status === "COMPLETED" ? new Date() : null },
    });
    const roadmap = await recalculateRoadmap(task.roadmapId);
    return NextResponse.json({ roadmapId: roadmap.id, progress: roadmap.progress, status: roadmap.status });
  } catch {
    return NextResponse.json({ error: "Unable to update this task." }, { status: 500 });
  }
}
