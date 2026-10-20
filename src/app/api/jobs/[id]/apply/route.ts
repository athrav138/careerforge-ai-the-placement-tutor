import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { createApplicationStatusNotification } from "@/lib/application-notifications";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const job = await prisma.jobOpportunity.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Job opportunity not found." }, { status: 404 });
  const application = await prisma.$transaction(async (transaction) => {
    const key = { studentProfileId_jobId: { studentProfileId: user.studentProfileId, jobId: job.id } };
    const previous = await transaction.jobApplication.findUnique({ where: key, select: { status: true, appliedAt: true } });
    const canAdvanceToApplied = !previous || ["DISCOVERED", "SAVED", "APPLIED"].includes(previous.status);
    const isNewApplication = !previous;
    const applied = await transaction.jobApplication.upsert({
      where: key,
      create: { studentProfileId: user.studentProfileId, jobId: job.id, status: "APPLIED", appliedAt: new Date() },
      update: canAdvanceToApplied
        ? { status: "APPLIED", appliedAt: previous?.appliedAt ?? new Date() }
        : {},
      include: { job: true },
    });
    if (canAdvanceToApplied && (isNewApplication || previous?.status !== "APPLIED")) {
      await createApplicationStatusNotification(transaction, user.studentProfileId, "APPLIED", applied.job.title);
    }
    return applied;
  });
  return NextResponse.json({ application });
}
