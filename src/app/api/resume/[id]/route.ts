import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumeId = params.id;

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        targetCareer: true,
        analysis: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Never return the raw extracted text in the GET API response for security
    const { extractedText, ...safeResume } = resume;

    return NextResponse.json({ resume: safeResume });
  } catch (error) {
    console.error("Fetch resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resumeId = params.id;

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.studentProfileId !== user.studentProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.resume.delete({
      where: { id: resumeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
