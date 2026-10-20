import "server-only";

import type { Prisma } from "@prisma/client";
import type { JobStatus } from "@/lib/jobs";

const STATUS_LABELS: Record<JobStatus, string> = {
  DISCOVERED: "discovered",
  SAVED: "saved",
  APPLIED: "applied",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected",
};

export async function createApplicationStatusNotification(
  transaction: Prisma.TransactionClient,
  studentProfileId: string,
  status: JobStatus,
  jobTitle: string,
) {
  const type = status === "OFFER" ? "SUCCESS" : status === "REJECTED" ? "WARNING" : "INFO";

  await transaction.notification.create({
    data: {
      studentProfileId,
      title: "Application updated",
      message: `Your tracked status for ${jobTitle} is now ${STATUS_LABELS[status]}.`,
      type,
    },
  });
}
