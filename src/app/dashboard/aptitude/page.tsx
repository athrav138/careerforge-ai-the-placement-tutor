"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Trophy,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import StatCard from "@/components/dashboard/stat-card";

type AssessmentCategory =
  | "QUANTITATIVE"
  | "LOGICAL_REASONING"
  | "VERBAL_ABILITY"
  | "DATA_INTERPRETATION"
  | "TECHNICAL";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type AssessmentQuestion = {
  id: string;
  question: string;
  category: AssessmentCategory;
  difficulty: Difficulty;
  options: [string, string, string, string];
  skill: string | null;
  selectedAnswer: string | null;
};

type AssessmentSession = {
  attemptId: string;
  title: string;
  category: AssessmentCategory;
  difficulty: Difficulty;
  questionCount: number;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  serverNow: string;
  questions: AssessmentQuestion[];
};

type AssessmentResult = {
  attemptId: string;
  title: string;
  category: AssessmentCategory;
  difficulty: Difficulty;
  questionCount: number;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  completedAt: string;
  timeTakenSeconds: number;
  status: "COMPLETED" | "EXPIRED";
  score: number;
  percentage: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
};

type AssessmentSummary = {
  latestScore: number | null;
  averageScore: number | null;
  testsCompleted: number;
  accuracy: number | null;
};

function errorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }
  return fallback;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function labelFor(value: string) {
  return value
    .split("_")
    .map((part) => `${part[0]}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

const categories: { value: AssessmentCategory; label: string }[] = [
  { value: "QUANTITATIVE", label: "Quantitative" },
  { value: "LOGICAL_REASONING", label: "Logical Reasoning" },
  { value: "VERBAL_ABILITY", label: "Verbal Ability" },
  { value: "DATA_INTERPRETATION", label: "Data Interpretation" },
  { value: "TECHNICAL", label: "Technical" },
];

export default function Aptitude() {
  const router = useRouter();
  const [summary, setSummary] = useState<AssessmentSummary | null>(null);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<AssessmentCategory>("QUANTITATIVE");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [questionCount, setQuestionCount] = useState(3);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionStarted = useRef(false);

  const applySession = useCallback((nextSession: AssessmentSession) => {
    setSession(nextSession);
    setAnswers(
      Object.fromEntries(
        nextSession.questions
          .filter((question) => question.selectedAnswer)
          .map((question) => [question.id, question.selectedAnswer as string]),
      ),
    );
    setCurrentIndex(0);
    const offset = Date.parse(nextSession.serverNow) - Date.now();
    setServerOffset(offset);
    setSecondsRemaining(
      Math.max(
        0,
        Math.ceil(
          (Date.parse(nextSession.expiresAt) - (Date.now() + offset)) / 1000,
        ),
      ),
    );
    setError("");
    submissionStarted.current = false;
  }, []);

  const loadDashboardData = useCallback(async () => {
    const [summaryResponse, historyResponse] = await Promise.all([
      fetch("/api/aptitude/summary", { cache: "no-store" }),
      fetch("/api/aptitude/attempts", { cache: "no-store" }),
    ]);
    const [summaryData, historyData] = await Promise.all([
      summaryResponse.json(),
      historyResponse.json(),
    ]);
    if (!summaryResponse.ok) {
      throw new Error(errorMessage(summaryData, "Unable to load aptitude summary."));
    }
    if (!historyResponse.ok) {
      throw new Error(errorMessage(historyData, "Unable to load assessment history."));
    }
    setSummary(summaryData as AssessmentSummary);
    setHistory((historyData as { attempts: AssessmentResult[] }).attempts);
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const dashboardData = loadDashboardData().catch((caught: unknown) => {
          if (mounted) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Unable to load aptitude summary and history.",
            );
          }
        });
        const activeResponse = await fetch("/api/aptitude/attempts/active", {
          cache: "no-store",
        });
        const activeData = await activeResponse.json();
        if (!activeResponse.ok) {
          throw new Error(errorMessage(activeData, "Unable to load your active assessment."));
        }
        if (!mounted) return;
        if (activeData.expiredAttemptId) {
          router.replace(`/dashboard/aptitude/results/${activeData.expiredAttemptId}`);
          return;
        }
        if (activeData.attempt) applySession(activeData.attempt as AssessmentSession);
        await dashboardData;
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load aptitude data.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applySession, loadDashboardData, router]);

  useEffect(() => {
    if (!session) return;

    const updateRemaining = () => {
      setSecondsRemaining(
        Math.max(
          0,
          Math.ceil(
            (Date.parse(session.expiresAt) - (Date.now() + serverOffset)) / 1000,
          ),
        ),
      );
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [session, serverOffset]);

  const submitAssessment = useCallback(async () => {
    if (!session || submissionStarted.current) return;
    submissionStarted.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/aptitude/attempts/${session.attemptId}/submit`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(data, "Unable to submit your assessment."));
      }
      const result = data.result;
      router.replace(`/dashboard/aptitude/results/${result.attemptId}`);
    } catch (caught) {
      submissionStarted.current = false;
      setError(caught instanceof Error ? caught.message : "Unable to submit your assessment.");
    } finally {
      setIsSubmitting(false);
    }
  }, [router, session]);

  useEffect(() => {
    if (session && secondsRemaining === 0 && !isSubmitting) {
      const timeout = window.setTimeout(() => { void submitAssessment(); }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [isSubmitting, secondsRemaining, session, submitAssessment]);

  const startAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStarting(true);
    setError("");
    try {
      const response = await fetch("/api/aptitude/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          difficulty,
          questionCount,
          durationMinutes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(data, "Unable to start the assessment."));
      }
      
      // Transform the response to match expected format
      const transformedSession: AssessmentSession = {
        attemptId: data.attempt.id,
        title: data.assessment.title,
        category: data.assessment.category,
        difficulty: data.assessment.difficulty,
        questionCount: data.assessment.totalQuestions,
        durationMinutes: data.assessment.durationMinutes,
        startedAt: data.attempt.startedAt,
        expiresAt: new Date(new Date(data.attempt.startedAt).getTime() + data.assessment.durationMinutes * 60 * 1000).toISOString(),
        serverNow: new Date().toISOString(),
        questions: data.questions.map((q: any, index: number) => ({
          ...q,
          selectedAnswer: null,
        })),
      };
      
      applySession(transformedSession);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the assessment.");
    } finally {
      setStarting(false);
    }
  };

  const saveAnswer = async (questionId: string, selectedAnswer: string) => {
    if (!session || isSubmitting || secondsRemaining === 0) return;
    const previousAnswer = answers[questionId];
    setAnswers((current) => ({ ...current, [questionId]: selectedAnswer }));
    setSavingQuestion(questionId);
    setError("");
    try {
      const response = await fetch(
        `/api/aptitude/attempts/${session.attemptId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedAnswer }),
        },
      );
      const data = await response.json();
      if (response.status === 410) {
        router.replace(`/dashboard/aptitude/results/${session.attemptId}`);
        return;
      }
      if (!response.ok) {
        throw new Error(errorMessage(data, "Unable to save your answer."));
      }
    } catch (caught) {
      setAnswers((current) => {
        const updated = { ...current };
        if (previousAnswer) updated[questionId] = previousAnswer;
        else delete updated[questionId];
        return updated;
      });
      setError(caught instanceof Error ? caught.message : "Unable to save your answer.");
    } finally {
      setSavingQuestion(null);
    }
  };

  const currentQuestion = session?.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <DashboardHeader
        title="Aptitude Assessment"
        subtitle="Choose a timed test or continue your active assessment."
      />

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Panel className="rounded-2xl p-8 text-center text-sm text-muted">
          Loading your aptitude assessments...
        </Panel>
      ) : session && currentQuestion ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Panel className="rounded-2xl p-5 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-mono tracking-widest text-muted">
                  {labelFor(session.category)} · {labelFor(session.difficulty)}
                </p>
                <h2 className="mt-2 text-xl font-black text-ink">{session.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  Question {currentIndex + 1} / {session.questions.length}
                </p>
              </div>
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-mono font-bold ${
                  (secondsRemaining ?? 0) <= 60
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-cyan/20 bg-cyan/5 text-ink"
                }`}
                aria-live="polite"
              >
                <Clock3 className="h-4 w-4" />
                <span>{formatTime(secondsRemaining ?? 0)}</span>
              </div>
            </div>

            <div className="min-h-64">
              <p className="text-lg font-semibold leading-relaxed text-ink">
                {currentQuestion.question}
              </p>
              {currentQuestion.skill && (
                <p className="mt-2 text-xs text-muted">Skill: {currentQuestion.skill}</p>
              )}
              <fieldset className="mt-6 space-y-3" disabled={isSubmitting || secondsRemaining === 0}>
                <legend className="sr-only">Choose an answer</legend>
                {currentQuestion.options.map((option, index) => {
                  const answer = String.fromCharCode(65 + index);
                  return (
                    <label
                      key={answer}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        answers[currentQuestion.id] === answer
                          ? "border-cyan bg-cyan/5"
                          : "border-line hover:border-cyan/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`answer-${currentQuestion.id}`}
                        value={answer}
                        checked={answers[currentQuestion.id] === answer}
                        onChange={() => void saveAnswer(currentQuestion.id, answer)}
                        disabled={savingQuestion === currentQuestion.id}
                        className="mt-1 accent-blue-600"
                      />
                      <span className="w-6 shrink-0 font-mono text-sm font-bold text-muted">
                        {answer}.
                      </span>
                      <span className="text-sm leading-relaxed text-ink">{option}</span>
                    </label>
                  );
                })}
              </fieldset>
              {savingQuestion === currentQuestion.id && (
                <p className="mt-3 text-xs text-muted" aria-live="polite">
                  Saving answer...
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                disabled={currentIndex === 0 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((index) =>
                    Math.min(session.questions.length - 1, index + 1),
                  )
                }
                disabled={currentIndex === session.questions.length - 1 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Panel>

          <div className="space-y-5">
            <Panel className="rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-ink">Question Navigator</h3>
                <span className="text-xs text-muted">
                  {answeredCount}/{session.questions.length} answered
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {session.questions.map((question, index) => {
                  const isCurrent = currentIndex === index;
                  const isAnswered = Boolean(answers[question.id]);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to question ${index + 1}${isAnswered ? ", answered" : ", unanswered"}`}
                      aria-current={isCurrent ? "step" : undefined}
                      className={`relative flex h-10 items-center justify-center rounded-lg border text-sm font-semibold ${
                        isCurrent
                          ? "border-cyan bg-cyan text-white"
                          : isAnswered
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-line bg-white text-muted hover:border-cyan/40"
                      }`}
                    >
                      {index + 1}
                      {isAnswered && !isCurrent && (
                        <CheckCircle2 className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white text-green-600" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-cyan" /> Current
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-green-100" /> Answered
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm border border-line bg-white" /> Unanswered
                </span>
              </div>
            </Panel>

            <Panel className="rounded-2xl p-5">
              <p className="text-sm text-muted">
                Your answers are saved as you go. You can revisit any question before submitting.
              </p>
              <button
                type="button"
                onClick={() => void submitAssessment()}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Assessment"}
              </button>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Panel className="rounded-2xl p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-ink">Start an assessment</h2>
                <p className="text-sm text-muted">Questions are selected from the secure question bank.</p>
              </div>
            </div>
            <form onSubmit={startAssessment} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm font-semibold text-ink">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as AssessmentCategory)}
                  className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-ink">
                Difficulty
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                  className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                >
                  {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((item) => (
                    <option key={item} value={item}>{labelFor(item)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-ink">
                Questions
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-ink">
                Duration (minutes)
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                  className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={starting || questionCount < 1 || durationMinutes < 1}
                  className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {starting ? "Starting..." : "Start Assessment"}
                </button>
              </div>
            </form>
            <p className="mt-4 text-xs text-muted">
              No active test? Start an assessment to test your placement readiness.
            </p>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Latest Aptitude Score",
                value: summary?.latestScore == null ? "—" : `${summary.latestScore}%`,
                detail: "Most recent assessment",
                icon: Trophy,
                accent: "cyan" as const,
              },
              {
                label: "Average Score",
                value: summary?.averageScore == null ? "—" : `${summary.averageScore}%`,
                detail: "Across completed tests",
                icon: CheckCircle2,
                accent: "success" as const,
              },
              {
                label: "Tests Completed",
                value: String(summary?.testsCompleted ?? 0),
                detail: "Saved assessment results",
                icon: Brain,
                accent: "forge" as const,
              },
              {
                label: "Accuracy",
                value: summary?.accuracy == null ? "—" : `${summary.accuracy}%`,
                detail: "Correct answers / attempted",
                icon: Clock3,
                accent: "warning" as const,
              },
            ].map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <Panel className="rounded-2xl p-5 sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-mono tracking-widest text-muted">ASSESSMENT HISTORY</p>
              <h2 className="mt-1 text-lg font-black text-ink">Previous Assessments</h2>
            </div>
            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
                No assessments completed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((attempt) => (
                  <Link
                    key={attempt.attemptId}
                    href={`/dashboard/aptitude/results/${attempt.attemptId}`}
                    className="flex flex-col gap-2 rounded-xl border border-line p-4 transition-colors hover:border-cyan/40 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-ink">{attempt.title}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {attempt.questionCount} Questions · {labelFor(attempt.difficulty)} · Completed{" "}
                        {new Date(attempt.completedAt).toLocaleDateString()}
                        {attempt.status === "EXPIRED" ? " · Time expired" : ""}
                      </p>
                    </div>
                    <span className="font-mono text-xl font-black text-cyan">
                      {Math.round(attempt.percentage)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}
    </>
  );
}
