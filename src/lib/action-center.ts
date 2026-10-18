import "server-only";

import { prisma } from "@/lib/prisma";
import { calculateReadiness } from "@/lib/readiness";
import { buildCareerActionTransaction, type ActionDraft } from "@/lib/action-center-transaction";

export const ACTION_CATEGORIES = ["SKILL", "RESUME", "APTITUDE", "INTERVIEW", "ROADMAP", "PROJECT", "GITHUB", "LINKEDIN", "JOB", "APPLICATION", "PROFILE"] as const;
export const ACTION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

function priorityFromGap(priority: string, gapLevel: string) {
  return priority === "HIGH" || ["CRITICAL", "HIGH"].includes(gapLevel) ? "HIGH" : gapLevel === "MEDIUM" ? "MEDIUM" : "LOW";
}

export async function buildActionDrafts(studentProfileId: string): Promise<ActionDraft[]> {
  const [profile, roadmap, projects, jobs, applications, resume, interviews, github, linkedin, readiness] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      select: {
        targetDomain: true,
        targetCareer: { select: { title: true } },
        skillGaps: { include: { skill: { select: { name: true } } }, orderBy: { priority: "desc" } },
      },
    }),
    prisma.learningRoadmap.findFirst({ where: { studentProfileId }, orderBy: { updatedAt: "desc" }, select: { tasks: { where: { status: { not: "COMPLETED" } }, select: { id: true, title: true, description: true, estimatedMinutes: true, priority: true } } } }),
    prisma.projectRecommendation.findMany({ where: { studentProfileId, status: { not: "COMPLETED" } }, include: { project: { select: { title: true, description: true, estimatedDuration: true } } }, orderBy: { relevanceScore: "desc" }, take: 3 }),
    prisma.jobRecommendation.findMany({ where: { studentProfileId, matchScore: { gte: 70 } }, include: { job: { select: { id: true, title: true, company: true } } }, orderBy: { matchScore: "desc" }, take: 5 }),
    prisma.jobApplication.findMany({ where: { studentProfileId }, select: { jobId: true, status: true } }),
    prisma.resume.findFirst({ where: { studentProfileId }, orderBy: { createdAt: "desc" }, select: { id: true, analysis: { select: { atsScore: true } } } }),
    prisma.interviewSession.findMany({ where: { studentProfileId, status: "COMPLETED", score: { not: null } }, select: { score: true, technicalScore: true } }),
    prisma.gitHubConnection.findUnique({ where: { studentProfileId }, select: { repositories: { select: { id: true, name: true, hasReadme: true } } } }),
    prisma.linkedInProfile.findUnique({ where: { studentProfileId }, select: { id: true, skills: { select: { id: true } }, experience: { select: { id: true } }, education: { select: { id: true } } } }),
    calculateReadiness(studentProfileId),
  ]);

  const drafts: ActionDraft[] = [];
  for (const gap of profile?.skillGaps ?? []) {
    drafts.push({
      source: `SKILL_GAP:${gap.skillId}`,
      sourceId: gap.skillId,
      title: `Close your ${gap.skill.name} skill gap`,
      description: `${gap.skill.name} is still missing for your target career. Build evidence through practice and projects.`,
      category: "SKILL",
      priority: priorityFromGap(gap.priority, gap.gapLevel) as ActionDraft["priority"],
      reason: `Your ${profile.targetCareer?.title ?? profile.targetDomain ?? "target career"} identifies ${gap.skill.name} as a ${gap.gapLevel.toLowerCase()} gap.`,
      actionUrl: "/dashboard/skills",
      estimatedMinutes: 45,
    });
  }

  for (const task of roadmap?.tasks ?? []) {
    drafts.push({ source: `ROADMAP:${task.id}`, sourceId: task.id, title: `Complete ${task.title}`, description: task.description ?? "Continue the next task in your learning roadmap.", category: "ROADMAP", priority: task.priority === "CRITICAL" || task.priority === "HIGH" ? "HIGH" : "MEDIUM", reason: "This task is unfinished in your active learning roadmap.", actionUrl: "/dashboard/roadmap", estimatedMinutes: task.estimatedMinutes ?? 30 });
  }

  for (const project of projects) {
    drafts.push({ source: `PROJECT:${project.id}`, sourceId: project.id, title: `Build ${project.project.title}`, description: project.project.description ?? "Complete this project to strengthen your portfolio evidence.", category: "PROJECT", priority: "MEDIUM", reason: "This project is recommended for your career profile and is not yet completed.", actionUrl: "/dashboard/projects", estimatedMinutes: (project.project.estimatedDuration ?? 4) * 60 });
  }

  const appliedJobIds = new Set(applications.filter((item) => ["APPLIED", "INTERVIEW", "OFFER"].includes(item.status)).map((item) => item.jobId));
  for (const recommendation of jobs) {
    if (!appliedJobIds.has(recommendation.jobId)) drafts.push({ source: `JOB:${recommendation.jobId}`, sourceId: recommendation.jobId, title: `Apply to ${recommendation.job.title}`, description: `${recommendation.job.title} at ${recommendation.job.company} is a ${recommendation.matchScore}% match for your profile.`, category: "JOB", priority: recommendation.matchScore >= 85 ? "HIGH" : "MEDIUM", reason: "A strong job match has no submitted application yet.", actionUrl: "/dashboard/jobs", estimatedMinutes: 20 });
  }

  const atsScore = resume?.analysis?.atsScore;
  if (!resume || typeof atsScore !== "number" || atsScore < 70) drafts.push({ source: `RESUME:${resume?.id ?? "MISSING"}`, sourceId: resume?.id, title: "Improve resume ATS coverage", description: typeof atsScore === "number" ? `Your latest ATS score is ${atsScore}%. Improve the resume before applying broadly.` : "Upload and analyze a resume to understand your ATS readiness.", category: "RESUME", priority: "HIGH", reason: typeof atsScore === "number" ? "Your latest ATS score is below the 70% readiness target." : "No analyzed resume is available yet.", actionUrl: "/dashboard/resume", estimatedMinutes: 30 });

  const interviewScores = interviews.map((item) => item.score).filter((score): score is number => score !== null);
  if (!interviewScores.length || Math.round(interviewScores.reduce((sum, score) => sum + score, 0) / interviewScores.length) < 70) drafts.push({ source: "INTERVIEW:TECHNICAL", title: "Practice a technical mock interview", description: "Complete two focused mock interviews and review the feedback after each attempt.", category: "INTERVIEW", priority: "HIGH", reason: interviewScores.length ? "Your completed interview average is below the 70% readiness target." : "No completed mock interview is available yet.", actionUrl: "/dashboard/interview", estimatedMinutes: 60 });

  if (!readiness.metrics.aptitude.available || readiness.metrics.aptitude.score < 65) drafts.push({ source: "APTITUDE:PRACTICE", title: "Practice aptitude questions", description: "Complete a focused aptitude assessment to improve problem-solving readiness.", category: "APTITUDE", priority: "MEDIUM", reason: readiness.metrics.aptitude.explanation, actionUrl: "/dashboard/aptitude", estimatedMinutes: 30 });

  if (!github || github.repositories.some((repo) => !repo.hasReadme)) drafts.push({ source: "GITHUB:README", title: "Improve documentation for your repositories", description: "Add clear README documentation to your top repositories so your technical evidence is easier to evaluate.", category: "GITHUB", priority: "MEDIUM", reason: github ? "At least one connected repository is missing a README." : "GitHub is not connected yet.", actionUrl: "/dashboard/github", estimatedMinutes: 30 });

  const linkedinComplete = linkedin && linkedin.skills.length > 0 && linkedin.experience.length > 0 && linkedin.education.length > 0;
  if (!linkedinComplete) drafts.push({ source: "LINKEDIN:PROFILE_COMPLETION", sourceId: linkedin?.id, title: "Complete your LinkedIn profile", description: "Add the missing profile evidence that helps recruiters understand your skills and experience.", category: "LINKEDIN", priority: "LOW", reason: linkedin ? "Your LinkedIn profile is missing skills, experience, or education evidence." : "No LinkedIn profile has been imported yet.", actionUrl: "/dashboard/linkedin", estimatedMinutes: 20 });

  return drafts;
}

export async function generateActions(studentProfileId: string) {
  const drafts = await buildActionDrafts(studentProfileId);
  const operations = buildCareerActionTransaction(prisma.careerAction, studentProfileId, drafts);

  // Keep stale-action deletion, regeneration, and the returned snapshot in one commit.
  const results = await prisma.$transaction(operations);
  return results[results.length - 1] as Awaited<ReturnType<typeof prisma.careerAction.findMany>>;
}

export async function getActionCenter(studentProfileId: string) {
  const [actions, readiness] = await Promise.all([prisma.careerAction.findMany({ where: { studentProfileId }, orderBy: [{ completed: "asc" }, { priority: "asc" }, { updatedAt: "desc" }] }), calculateReadiness(studentProfileId)]);
  return { actions, readiness };
}
