import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";

export type PreparationItem = {
  id: string;
  title: string;
  description: string;
  reason: string;
  href: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  estimatedMinutes: number | null;
  source: "CAREER_ACTION" | "READINESS";
  completed: boolean;
};

function priorityRank(priority: PreparationItem["priority"]) {
  return priority === "HIGH" ? 0 : priority === "MEDIUM" ? 1 : 2;
}

/** Compose a preparation overview from student-scoped records and existing rules. */
export async function getPlacementPreparation(studentProfileId: string) {
  const [profile, activeRoadmap, readiness, actions] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
        targetDomain: true,
        targetCareer: { select: { title: true } },
        careerAnalyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            careerRole: { select: { title: true } },
            matchPercentage: true,
            missingSkills: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.learningRoadmap.findFirst({
      where: { studentProfileId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        progress: true,
        tasks: { select: { id: true, status: true, dueDate: true } },
      },
    }),
    calculateReadiness(studentProfileId),
    prisma.careerAction.findMany({
      where: { studentProfileId },
      orderBy: [{ completed: "asc" }, { updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        reason: true,
        category: true,
        priority: true,
        actionUrl: true,
        estimatedMinutes: true,
        completed: true,
        updatedAt: true,
      },
    }),
  ]);

  const items: PreparationItem[] = actions.map((action) => ({
    id: action.id,
    title: action.title,
    description: action.description,
    reason: action.reason,
    href: action.actionUrl || "/dashboard/action-center",
    priority: action.priority === "HIGH" ? "HIGH" : action.priority === "LOW" ? "LOW" : "MEDIUM",
    category: action.category,
    estimatedMinutes: action.estimatedMinutes,
    source: "CAREER_ACTION",
    completed: action.completed,
  }));

  const activeTitles = new Set(
    items.filter((item) => !item.completed).map((item) => item.title.trim().toLowerCase()),
  );
  for (const recommendation of readiness.recommendations) {
    const key = recommendation.title.trim().toLowerCase();
    if (activeTitles.has(key)) continue;
    items.push({
      id: recommendation.id,
      title: recommendation.title,
      description: recommendation.detail,
      reason: recommendation.detail,
      href: recommendation.href,
      priority: "MEDIUM",
      category: "READINESS",
      estimatedMinutes: null,
      source: "READINESS",
      completed: false,
    });
    activeTitles.add(key);
  }

  const now = new Date();
  const overdueTaskCount = activeRoadmap?.tasks.filter(
    (task) => task.status !== "COMPLETED" && task.dueDate !== null && task.dueDate < now,
  ).length ?? 0;
  const openTaskCount = activeRoadmap?.tasks.filter((task) => task.status !== "COMPLETED").length ?? 0;
  const completedTaskCount = activeRoadmap?.tasks.filter((task) => task.status === "COMPLETED").length ?? 0;

  const openItems = items.filter((item) => !item.completed).sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.title.localeCompare(b.title),
  );

  return {
    targetCareer: profile?.targetCareer?.title ?? profile?.careerAnalyses[0]?.careerRole.title ?? profile?.targetDomain ?? null,
    careerAnalysis: profile?.careerAnalyses[0] ? {
      role: profile.careerAnalyses[0].careerRole.title,
      matchPercentage: profile.careerAnalyses[0].matchPercentage,
      missingSkills: profile.careerAnalyses[0].missingSkills,
      analyzedAt: profile.careerAnalyses[0].createdAt,
    } : null,
    readiness: {
      overallScore: readiness.overallScore,
      metrics: readiness.metrics,
      weakSkillCount: readiness.weakSkillCount,
      computedAt: readiness.computedAt,
    },
    roadmap: activeRoadmap ? {
      title: activeRoadmap.title,
      status: activeRoadmap.status,
      progress: activeRoadmap.progress,
      openTaskCount,
      completedTaskCount,
      overdueTaskCount,
    } : null,
    actions: {
      totalOpen: openItems.length,
      highPriority: openItems.filter((item) => item.priority === "HIGH").length,
      completed: items.filter((item) => item.completed).length,
      items: openItems.slice(0, 10),
    },
    generatedAt: now.toISOString(),
  };
}
