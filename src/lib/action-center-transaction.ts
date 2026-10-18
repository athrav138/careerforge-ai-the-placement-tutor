import type { Prisma } from "@prisma/client";

export type ActionDraft = {
  source: string;
  sourceId?: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  reason: string;
  actionUrl?: string;
  estimatedMinutes?: number;
};

type CareerActionDelegate = Pick<
  Prisma.TransactionClient["careerAction"],
  "deleteMany" | "upsert" | "findMany"
>;

/** Build every regeneration read/write against the delegate owned by one Prisma transaction. */
export function buildCareerActionTransaction(
  careerAction: CareerActionDelegate,
  studentProfileId: string,
  drafts: ActionDraft[],
) {
  const sources = drafts.map((draft) => draft.source);

  return [
    careerAction.deleteMany({
      where: {
        studentProfileId,
        completed: false,
        source: { notIn: sources.length ? sources : ["__none__"] },
      },
    }),
    ...drafts.map((draft) => careerAction.upsert({
      where: { studentProfileId_source: { studentProfileId, source: draft.source } },
      create: { studentProfileId, ...draft },
      update: { ...draft },
    })),
    careerAction.findMany({
      where: { studentProfileId },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { updatedAt: "desc" }],
    }),
  ];
}
