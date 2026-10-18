import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { JOB_STATUSES } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const application = await prisma.jobApplication.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (application.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.status !== "string" || !JOB_STATUSES.includes(body.status as (typeof JOB_STATUSES)[number])) {
    return NextResponse.json({ error: "A valid application status is required." }, { status: 400 });
  }
  const updated = await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      status: body.status,
      notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2_000) || null : application.notes,
      interviewDate: typeof body.interviewDate === "string" ? new Date(body.interviewDate) : application.interviewDate,
      interviewNotes: typeof body.interviewNotes === "string" ? body.interviewNotes.trim().slice(0, 2_000) || null : application.interviewNotes,
      followUpDate: typeof body.followUpDate === "string" ? new Date(body.followUpDate) : application.followUpDate,
      appliedAt: body.status === "APPLIED" && !application.appliedAt ? new Date() : application.appliedAt,
    },
    include: { job: true },
  });
  return NextResponse.json({ application: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const application = await prisma.jobApplication.findUnique({ where: { id: params.id }, select: { studentProfileId: true } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  if (application.studentProfileId !== user.studentProfileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.jobApplication.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
