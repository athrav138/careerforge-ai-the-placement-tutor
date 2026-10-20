export const READINESS_WEIGHTS = {
  career: 12,
  skills: 18,
  resume: 12,
  aptitude: 12,
  interview: 12,
  learning: 12,
  projects: 8,
  github: 7,
  linkedin: 7,
} as const;

type MetricKey = keyof typeof READINESS_WEIGHTS;
type ScoredMetric = { score: number; available: boolean };
type ReadinessMetric = ScoredMetric & { explanation: string };

export function calculateGitHubReadiness(
  connected: boolean,
  repositoryCount: number,
  repositoriesWithReadme: number,
  skillEvidenceCount: number,
): ReadinessMetric {
  if (!connected) {
    return { score: 0, available: false, explanation: "Connect GitHub to provide technical portfolio evidence." };
  }
  if (repositoryCount <= 0) {
    return { score: 0, available: false, explanation: "No repositories are available to assess yet." };
  }
  const score = Math.max(0, Math.min(100, Math.round(
    (repositoriesWithReadme / repositoryCount) * 50 +
    (skillEvidenceCount / repositoryCount) * 50,
  )));
  return {
    score,
    available: true,
    explanation: `${repositoryCount} repositories with ${skillEvidenceCount} detected skills. Score combines README coverage and skill evidence, weighted equally.`,
  };
}
/** Existing overall readiness formula: weighted component scores, with unavailable evidence contributing zero. */
export function calculateWeightedReadiness(metrics: Record<MetricKey, ScoredMetric>): number {
  const weightedScore = (Object.keys(READINESS_WEIGHTS) as MetricKey[]).reduce(
    (total, key) => total + metrics[key].score * (READINESS_WEIGHTS[key] / 100),
    0,
  );
  return Math.max(0, Math.min(100, Math.round(weightedScore)));
}
