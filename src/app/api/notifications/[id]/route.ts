import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function PUT(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: { id: params.id, studentProfileId: user.studentProfileId },
      data: { isRead: true }
    });
    if (!result.count) return NextResponse.json({ error: "Notification not found." }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user?.studentProfileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const result = await prisma.notification.deleteMany({
      where: { id, studentProfileId: user.studentProfileId },
    });
    if (!result.count) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
