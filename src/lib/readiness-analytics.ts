export type ReadinessMetricKey = "career" | "skills" | "resume" | "aptitude" | "interview" | "learning" | "projects" | "github" | "linkedin";
export type ReadinessMetric = { score: number; available: boolean; explanation: string };
export type ReadinessSnapshot = { date: string; readiness: number };
export type AnalyticsPayload = {
  readiness: {
    overallScore: number;
    metrics: Record<ReadinessMetricKey, ReadinessMetric>;
    weakSkillCount: number;
    computedAt: string;
  };
  historical: { snapshots: Array<{ date: string; overallScore: number }>; change: number | null };
  activity: { totalLast30Days: number; activeDaysLast7: number; byDayLast7: Array<{ date: string; count: number }> };
  completedCounts: {
    assessments: number;
    aptitude: number;
    interviews: number;
    roadmapTasks: number;
    projects: number;
    actions: number;
    careerAnalyses: number;
    resumeAnalyses: number;
  };
  recentActivity: Array<{ type: string; title: string; category: string; timestamp: string }>;
  generatedAt: string;
};

export function filterReadinessHistory(history: ReadinessSnapshot[], cutoff: number): ReadinessSnapshot[] {
  return history.filter((snapshot) => new Date(snapshot.date).getTime() >= cutoff);
}

export async function requestReadinessAnalytics(fetcher: typeof fetch = fetch): Promise<AnalyticsPayload> {
  const response = await fetcher("/api/analytics", { cache: "no-store" });
  if (!response.ok) throw new Error("Analytics unavailable");
  return response.json() as Promise<AnalyticsPayload>;
}