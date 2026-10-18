import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { scoreJob } from "@/lib/jobs";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const user = await getCurrentUser();
  if (!user?.studentProfileId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const job = await prisma.jobOpportunity.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Job opportunity not found." }, { status: 404 });
  try {
    return NextResponse.json({ match: await scoreJob(user.studentProfileId, job) });
  } catch (error) {
    console.error("Unable to calculate job match:", error);
    return NextResponse.json({ error: "Unable to calculate job match." }, { status: 500 });
  }
}
