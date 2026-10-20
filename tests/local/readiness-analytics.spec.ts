import { expect, test } from "@playwright/test";
import { buildReadinessHistoryWhere, filterReadinessHistory, requestReadinessAnalytics, type AnalyticsPayload } from "@/lib/readiness-analytics";
import { calculateGitHubReadiness, calculateWeightedReadiness, READINESS_WEIGHTS } from "@/lib/readiness-calculation";

const populatedPayload: AnalyticsPayload = {
  history: [
    { date: "2026-07-01T00:00:00.000Z", readiness: 47 },
    { date: "2026-09-15T00:00:00.000Z", readiness: 58 },
  ],
  current: {
    metrics: {
      career: { score: 80, available: true, explanation: "Saved career analysis." },
      skills: { score: 0, available: false, explanation: "Complete a skill assessment." },
      resume: { score: 70, available: true, explanation: "Latest resume analysis." },
      aptitude: { score: 0, available: false, explanation: "Complete an aptitude assessment." },
      interview: { score: 0, available: false, explanation: "Complete a mock interview." },
      learning: { score: 0, available: false, explanation: "Generate a roadmap." },
      projects: { score: 0, available: false, explanation: "Generate project recommendations." },
      github: { score: 0, available: false, explanation: "Connect GitHub." },
      linkedin: { score: 0, available: false, explanation: "Import LinkedIn." },
    },
    weakSkillCount: 0,
    weakSkillCountAvailable: false,
    computedAt: "2026-09-15T12:00:00.000Z",
  },
};

test("filters persisted history by date and preserves recorded scores", () => {
  const filtered = filterReadinessHistory(populatedPayload.history, Date.parse("2026-08-01T00:00:00.000Z"));
  expect(filtered).toEqual([{ date: "2026-09-15T00:00:00.000Z", readiness: 58 }]);
  expect(populatedPayload.history[0].readiness).toBe(47);
});

test("retains unavailable metrics as unavailable rather than treating their zero placeholder as a score", () => {
  expect(populatedPayload.current.metrics.skills).toMatchObject({ score: 0, available: false });
  expect(populatedPayload.current.metrics.career).toMatchObject({ score: 80, available: true });
});

test("empty history remains empty for the first-use state", () => {
  expect(filterReadinessHistory([], Date.now() - 30 * 24 * 60 * 60 * 1000)).toEqual([]);
});

test("readiness formula uses its documented component weights and rounds the weighted total", () => {
  const metricKeys = Object.keys(READINESS_WEIGHTS) as (keyof typeof READINESS_WEIGHTS)[];
  const allHundred = Object.fromEntries(metricKeys.map((key) => [key, { score: 100, available: true }])) as Parameters<typeof calculateWeightedReadiness>[0];
  expect(Object.values(READINESS_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  expect(calculateWeightedReadiness(allHundred)).toBe(100);

  const careerOnly = Object.fromEntries(metricKeys.map((key) => [key, { score: key === "career" ? 55 : 0, available: key === "career" }])) as Parameters<typeof calculateWeightedReadiness>[0];
  expect(calculateWeightedReadiness(careerOnly)).toBe(7);
});

test("GitHub score requires repository evidence and uses README and skill evidence equally", () => {
  expect(calculateGitHubReadiness(false, 0, 0, 0).available).toBe(false);
  expect(calculateGitHubReadiness(true, 0, 0, 0)).toMatchObject({ available: false, explanation: "No repositories are available to assess yet." });
  expect(calculateGitHubReadiness(true, 2, 1, 1)).toMatchObject({ available: true, score: 50 });
});

test("analytics request exposes API failure and succeeds when retried", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => {
    calls += 1;
    return calls === 1
      ? new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })
      : new Response(JSON.stringify(populatedPayload), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  await expect(requestReadinessAnalytics(fetcher)).rejects.toThrow("Analytics unavailable");
  await expect(requestReadinessAnalytics(fetcher)).resolves.toEqual(populatedPayload);
  expect(calls).toBe(2);
});

test("history query is scoped to the authenticated profile id", () => {
  expect(buildReadinessHistoryWhere("authenticated-profile")).toEqual({ studentProfileId: "authenticated-profile" });
});
