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
    const previous = await transaction.jobApplication.findUnique({ where: key, select: { status: true } });
    const saved = await transaction.jobApplication.upsert({
      where: key,
      create: { studentProfileId: user.studentProfileId, jobId: job.id, status: "SAVED" },
      // Saving an already tracked application must not reset a later stage.
      update: {},
      include: { job: true },
    });
    if (!previous) {
      await createApplicationStatusNotification(transaction, user.studentProfileId, "SAVED", saved.job.title);
    }
    return saved;
  });
  return NextResponse.json({ application });
}
