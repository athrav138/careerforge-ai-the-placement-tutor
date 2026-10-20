import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { JOB_STATUSES, type JobStatus } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { createApplicationStatusNotification } from "@/lib/application-notifications";

function parseOptionalDate(value: unknown): { valid: true; value: Date | null } | { valid: false } {
  if (value === null || value === "") return { valid: true, value: null };
  if (typeof value !== "string") return { valid: false };
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? { valid: false } : { valid: true, value: parsed };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body.status !== "string" || !JOB_STATUSES.includes(body.status as JobStatus)) {
      return NextResponse.json({ error: "A valid application status is required." }, { status: 400 });
    }
    for (const field of ["notes", "interviewNotes"] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
        return NextResponse.json({ error: `${field} must be text.` }, { status: 400 });
      }
    }
    const interviewDate = body.interviewDate === undefined ? undefined : parseOptionalDate(body.interviewDate);
    const followUpDate = body.followUpDate === undefined ? undefined : parseOptionalDate(body.followUpDate);
    if ((interviewDate && !interviewDate.valid) || (followUpDate && !followUpDate.valid)) {
      return NextResponse.json({ error: "Dates must be valid date values or empty." }, { status: 400 });
    }

    const application = await prisma.$transaction(async (transaction) => {
      const owned = await transaction.jobApplication.findFirst({
        where: { id: params.id, studentProfileId: user.studentProfileId },
        include: { job: true },
      });
      if (!owned) return null;
      const status = body.status as JobStatus;
      const result = await transaction.jobApplication.updateMany({
        where: { id: params.id, studentProfileId: user.studentProfileId },
        data: {
          status,
          ...(body.notes !== undefined ? { notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2_000) || null : null } : {}),
          ...(body.interviewNotes !== undefined ? { interviewNotes: typeof body.interviewNotes === "string" ? body.interviewNotes.trim().slice(0, 2_000) || null : null } : {}),
          ...(interviewDate?.valid ? { interviewDate: interviewDate.value } : {}),
          ...(followUpDate?.valid ? { followUpDate: followUpDate.value } : {}),
          ...(status === "APPLIED" && !owned.appliedAt ? { appliedAt: new Date() } : {}),
        },
      });
      if (!result.count) return null;
      const updated = await transaction.jobApplication.findFirst({
        where: { id: params.id, studentProfileId: user.studentProfileId },
        include: { job: true },
      });
      if (!updated) return null;
      if (owned.status !== status) {
        await createApplicationStatusNotification(transaction, user.studentProfileId, status, updated.job.title);
      }
      return updated;
    });
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ application });
  } catch (error) {
    console.error("Application update failed:", error);
    return NextResponse.json({ error: "Unable to update application." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const result = await prisma.jobApplication.deleteMany({
      where: { id: params.id, studentProfileId: user.studentProfileId },
    });
    if (!result.count) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Application deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete application." }, { status: 500 });
  }
}
