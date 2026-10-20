export type ReadinessMetricKey = "career" | "skills" | "resume" | "aptitude" | "interview" | "learning" | "projects" | "github" | "linkedin";
export type ReadinessMetric = { score: number; available: boolean; explanation: string };
export type ReadinessSnapshot = { date: string; readiness: number };
export type AnalyticsPayload = {
  history: ReadinessSnapshot[];
  current: { metrics: Record<ReadinessMetricKey, ReadinessMetric>; weakSkillCount: number; weakSkillCountAvailable: boolean; computedAt: string };
};

export function buildReadinessHistoryWhere(studentProfileId: string) {
  return { studentProfileId };
}

export function filterReadinessHistory(history: ReadinessSnapshot[], cutoff: number): ReadinessSnapshot[] {
  return history.filter((snapshot) => new Date(snapshot.date).getTime() >= cutoff);
}

export async function requestReadinessAnalytics(fetcher: typeof fetch = fetch): Promise<AnalyticsPayload> {
  const response = await fetcher("/api/readiness/history", { cache: "no-store" });
  if (!response.ok) throw new Error("Analytics unavailable");
  return response.json() as Promise<AnalyticsPayload>;
}
