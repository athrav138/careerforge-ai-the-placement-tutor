import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";
import { getStudentRoadmap } from "@/lib/roadmap";

export type PreparationOverview = {
  targetCareer: {
    id: string | null;
    title: string | null;
    domain: string | null;
    matchPercentage: number | null;
    matchedSkills: string[];
    missingSkills: string[];
  };
  readinessScore: number;
  weakSkillCount: number;
  completedActivities: {
    roadmapTasks: number;
    aptitudeTests: number;
    interviews: number;
    projects: number;
  };
  pendingActivities: {
    roadmapTasks: number;
    skillGaps: number;
    recommendedProjects: number;
    jobMatches: number;
  };
  lastActivity: string | null;
};

export type RoleSpecificPreparation = {
  careerId: string | null;
  careerTitle: string | null;
  requiredSkills: string[];
  currentSkillCoverage: number;
  skillGaps: Array<{
    skillName: string;
    gapLevel: string;
    priority: string;
  }>;
  roadmapProgress: number;
  recommendedPathways: Array<{
    category: string;
    title: string;
    description: string;
    href: string;
  }>;
};

export type LearningAndPractice = {
  roadmap: {
    exists: boolean;
    progress: number;
    title: string | null;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  aptitude: {
    latestScore: number | null;
    averageScore: number | null;
    testsCompleted: number;
    weakCategories: string[];
  };
  projects: {
    totalRecommended: number;
    completed: number;
    inProgress: number;
  };
  interviews: {
    completed: number;
    averageScore: number | null;
    weakAreas: string[];
  };
};

export type EvidenceAndProgress = {
  resume: {
    atsScore: number | null;
    uploaded: boolean;
    analyzed: boolean;
    lastAnalyzed: string | null;
  };
  github: {
    connected: boolean;
    repositoryCount: number;
    readmeCount: number;
    skillEvidenceCount: number;
  };
  linkedin: {
    imported: boolean;
    skillCount: number;
    experienceCount: number;
    educationCount: number;
  };
  jobApplications: {
    total: number;
    applied: number;
    interview: number;
    offer: number;
  };
};

export async function getPreparationOverview(studentProfileId: string): Promise<PreparationOverview> {
  const [profile, careerAnalysis, readiness, roadmap, aptitudeAttempts, interviews, projects, applications, github, linkedin] =
    await Promise.all([
      prisma.studentProfile.findUnique({
        where: { id: studentProfileId },
        select: {
          targetCareer: { select: { id: true, title: true, domain: true } },
          targetDomain: true,
        },
      }),
      prisma.careerAnalysis.findFirst({
        where: { studentProfileId },
        orderBy: { createdAt: "desc" },
        select: {
          matchPercentage: true,
          matchedSkills: true,
          missingSkills: true,
          careerRole: { select: { title: true } },
        },
      }),
      calculateReadiness(studentProfileId),
      getStudentRoadmap(studentProfileId),
      prisma.aptitudeAttempt.findMany({
        where: { studentProfileId },
        select: { score: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.interviewSession.findMany({
        where: { studentProfileId, status: "COMPLETED" },
        select: { score: true, createdAt: true },
      }),
      prisma.projectRecommendation.groupBy({
        by: ["status"],
        where: { studentProfileId },
        _count: { _all: true },
      }),
      prisma.jobApplication.groupBy({
        by: ["status"],
        where: { studentProfileId },
        _count: { _all: true },
      }),
      prisma.gitHubConnection.findUnique({
        where: { studentProfileId },
        select: { _count: { select: { repositories: true } } },
      }),
      prisma.linkedInProfile.findUnique({
        where: { studentProfileId },
        select: { id: true },
      }),
    ]);

  const completedTasks = roadmap?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const totalTasks = roadmap?.tasks.length ?? 0;
  const today = new Date();
  const overdueTasks = roadmap?.tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < today
  ).length ?? 0;

  const projectStats = projects.reduce(
    (acc, group) => {
      if (group.status === "COMPLETED") acc.completed += group._count._all;
      if (group.status === "IN_PROGRESS") acc.inProgress += group._count._all;
      acc.total += group._count._all;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0 }
  );

  const jobStats = applications.reduce(
    (acc, group) => {
      if (group.status === "APPLIED") acc.applied += group._count._all;
      if (group.status === "INTERVIEW") acc.interview += group._count._all;
      if (group.status === "OFFER") acc.offer += group._count._all;
      acc.total += group._count._all;
      return acc;
    },
    { total: 0, applied: 0, interview: 0, offer: 0 }
  );

  const allActivities = [
    ...aptitudeAttempts.map((a) => a.createdAt),
    ...interviews.map((i) => i.createdAt),
  ].sort((a, b) => b.getTime() - a.getTime());

  return {
    targetCareer: {
      id: profile?.targetCareer?.id ?? null,
      title: profile?.targetCareer?.title ?? null,
      domain: profile?.targetCareer?.domain ?? null,
      matchPercentage: careerAnalysis?.matchPercentage ?? null,
      matchedSkills: careerAnalysis?.matchedSkills ?? [],
      missingSkills: careerAnalysis?.missingSkills ?? [],
    },
    readinessScore: readiness.overallScore,
    weakSkillCount: readiness.weakSkillCount,
    completedActivities: {
      roadmapTasks: completedTasks,
      aptitudeTests: aptitudeAttempts.length,
      interviews: interviews.length,
      projects: projectStats.completed,
    },
    pendingActivities: {
      roadmapTasks: totalTasks - completedTasks,
      skillGaps: readiness.weakSkillCount,
      recommendedProjects: projectStats.total - projectStats.completed,
      jobMatches: jobStats.total,
    },
    lastActivity: allActivities[0]?.toISOString() ?? null,
  };
}

export async function getRoleSpecificPreparation(studentProfileId: string): Promise<RoleSpecificPreparation> {
  const [profile, careerAnalysis, skillGaps, roadmap, careerRole] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
        targetCareer: { select: { id: true, title: true, requiredSkills: true } },
      },
    }),
    prisma.careerAnalysis.findFirst({
      where: { studentProfileId },
      orderBy: { createdAt: "desc" },
      select: { matchPercentage: true, matchedSkills: true, missingSkills: true },
    }),
    prisma.skillGap.findMany({
      where: { studentProfileId },
      include: { skill: { select: { name: true } } },
      orderBy: { priority: "desc" },
      take: 10,
    }),
    getStudentRoadmap(studentProfileId),
    prisma.careerRole.findFirst({
      where: { id: profile?.targetCareer?.id },
      select: { requiredSkills: true },
    }),
  ]);

  const completedTasks = roadmap?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const totalTasks = roadmap?.tasks.length ?? 0;
  const skillCoverage = careerAnalysis
    ? (careerAnalysis.matchedSkills.length / Math.max(1, careerAnalysis.matchedSkills.length + careerAnalysis.missingSkills.length)) * 100
    : 0;

  const pathways: RoleSpecificPreparation["recommendedPathways"] = [];

  if (skillGaps.length > 0) {
    pathways.push({
      category: "SKILL",
      title: "Close skill gaps",
      description: `Focus on ${Math.min(3, skillGaps.length)} priority skills to improve your role alignment.`,
      href: "/dashboard/skills",
    });
  }

  if (totalTasks > completedTasks) {
    pathways.push({
      category: "ROADMAP",
      title: "Continue learning roadmap",
      description: `${totalTasks - completedTasks} tasks remain in your personalized learning plan.`,
      href: "/dashboard/roadmap",
    });
  }

  if (careerAnalysis && careerAnalysis.matchPercentage < 80) {
    pathways.push({
      category: "CAREER",
      title: "Improve career alignment",
      description: `Add missing skills to reach 80%+ match for your target role.`,
      href: "/dashboard/career",
    });
  }

  return {
    careerId: profile?.targetCareer?.id ?? null,
    careerTitle: profile?.targetCareer?.title ?? null,
    requiredSkills: careerRole?.requiredSkills ?? [],
    currentSkillCoverage: Math.round(skillCoverage),
    skillGaps: skillGaps.map((gap) => ({
      skillName: gap.skill.name,
      gapLevel: gap.gapLevel,
      priority: gap.priority,
    })),
    roadmapProgress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    recommendedPathways: pathways,
  };
}

export async function getLearningAndPractice(studentProfileId: string): Promise<LearningAndPractice> {
  const [roadmap, aptitudeAttempts, skillPerformances, projects, interviews] = await Promise.all([
    getStudentRoadmap(studentProfileId),
    prisma.aptitudeAttempt.findMany({
      where: { studentProfileId },
      select: { score: true, category: true },
    }),
    prisma.skillPerformance.findMany({
      where: { studentProfileId },
      select: { accuracy: number, classification: string },
    }),
    prisma.projectRecommendation.groupBy({
      by: ["status"],
      where: { studentProfileId },
      _count: { _all: true },
    }),
    prisma.interviewSession.findMany({
      where: { studentProfileId, status: "COMPLETED" },
      select: { score: true },
    }),
  ]);

  const completedTasks = roadmap?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const totalTasks = roadmap?.tasks.length ?? 0;
  const today = new Date();
  const overdueTasks = roadmap?.tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < today
  ).length ?? 0;

  const aptitudeScores = aptitudeAttempts.map((a) => a.score);
  const averageAptitude = aptitudeScores.length
    ? aptitudeScores.reduce((sum, score) => sum + score, 0) / aptitudeScores.length
    : null;

  const weakCategories = skillPerformances
    .filter((sp) => sp.classification === "CRITICAL" || sp.classification === "WEAK")
    .map((sp) => sp.classification);

  const projectStats = projects.reduce(
    (acc, group) => {
      if (group.status === "COMPLETED") acc.completed += group._count._all;
      if (group.status === "IN_PROGRESS") acc.inProgress += group._count._all;
      acc.total += group._count._all;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0 }
  );

  const interviewScores = interviews.map((i) => i.score).filter((s): s is number => s !== null);
  const averageInterview = interviewScores.length
    ? interviewScores.reduce((sum, score) => sum + score, 0) / interviewScores.length
    : null;

  return {
    roadmap: {
      exists: !!roadmap,
      progress: roadmap?.progress ?? 0,
      title: roadmap?.title ?? null,
      totalTasks,
      completedTasks,
      overdueTasks,
    },
    aptitude: {
      latestScore: aptitudeScores[0] ?? null,
      averageScore: averageAptitude ? Math.round(averageAptitude) : null,
      testsCompleted: aptitudeAttempts.length,
      weakCategories: [...new Set(weakCategories)],
    },
    projects: {
      totalRecommended: projectStats.total,
      completed: projectStats.completed,
      inProgress: projectStats.inProgress,
    },
    interviews: {
      completed: interviews.length,
      averageScore: averageInterview ? Math.round(averageInterview) : null,
      weakAreas: averageInterview && averageInterview < 70 ? ["Technical", "Communication"] : [],
    },
  };
}

export async function getEvidenceAndProgress(studentProfileId: string): Promise<EvidenceAndProgress> {
  const [resume, github, linkedin, applications] = await Promise.all([
    prisma.resume.findFirst({
      where: { studentProfileId },
      orderBy: { createdAt: "desc" },
      select: {
        analysis: { select: { atsScore: true } },
        createdAt: true,
      },
    }),
    prisma.gitHubConnection.findUnique({
      where: { studentProfileId },
      select: {
        _count: {
          select: {
            repositories: { where: { hasReadme: true } },
            skillEvidence: true,
          },
        },
      },
    }),
    prisma.linkedInProfile.findUnique({
      where: { studentProfileId },
      select: {
        _count: {
          select: {
            skills: true,
            experience: true,
            education: true,
          },
        },
      },
    }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { studentProfileId },
      _count: { _all: true },
    }),
  ]);

  const jobStats = applications.reduce(
    (acc, group) => {
      if (group.status === "APPLIED") acc.applied += group._count._all;
      if (group.status === "INTERVIEW") acc.interview += group._count._all;
      if (group.status === "OFFER") acc.offer += group._count._all;
      acc.total += group._count._all;
      return acc;
    },
    { total: 0, applied: 0, interview: 0, offer: 0 }
  );

  return {
    resume: {
      atsScore: resume?.analysis?.atsScore ?? null,
      uploaded: !!resume,
      analyzed: !!resume?.analysis,
      lastAnalyzed: resume?.createdAt.toISOString() ?? null,
    },
    github: {
      connected: !!github,
      repositoryCount: github?._count.repositories ?? 0,
      readmeCount: github?._count.repositories ?? 0,
      skillEvidenceCount: github?._count.skillEvidence ?? 0,
    },
    linkedin: {
      imported: !!linkedin,
      skillCount: linkedin?._count.skills ?? 0,
      experienceCount: linkedin?._count.experience ?? 0,
      educationCount: linkedin?._count.education ?? 0,
    },
    jobApplications: jobStats,
  };
}
