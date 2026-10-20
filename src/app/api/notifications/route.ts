import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.studentProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedLimit = Number(new URL(request.url).searchParams.get("limit"));
    const take = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 30;
    const where = { studentProfileId: user.studentProfileId };
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
