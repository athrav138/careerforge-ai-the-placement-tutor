import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const job = await prisma.jobOpportunity.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!job) return NextResponse.json({ error: "Job opportunity not found." }, { status: 404 });
  const application = await prisma.jobApplication.upsert({
    where: { studentProfileId_jobId: { studentProfileId: user.studentProfileId, jobId: job.id } },
    create: { studentProfileId: user.studentProfileId, jobId: job.id, status: "SAVED" },
    update: { status: "SAVED" },
    include: { job: true },
  });
  return NextResponse.json({ application });
}
