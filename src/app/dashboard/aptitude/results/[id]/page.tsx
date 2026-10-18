"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Trophy, XCircle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import StatCard from "@/components/dashboard/stat-card";
import WeakSkillsPanel from "@/components/aptitude/WeakSkillsPanel";

type AssessmentResult = {
  result: {
    attemptId: string;
    assessment: {
      id: string;
      title: string;
      category: string;
      difficulty: string;
    };
    score: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    categoryPerformance: Array<{
      category: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
    difficultyPerformance: Array<{
      difficulty: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
    status: string;
    startedAt: string;
    completedAt: string;
  };
  answers: Array<{
    questionId: string;
    question: string;
    options: string[];
    category: string;
    difficulty: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
    skill: string | null;
  }>;
};

function labelFor(value: string) {
  return value
    .split("_")
    .map((part) => `${part[0]}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function getScoreColor(score: number) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

function getScoreInterpretation(score: number) {
  if (score >= 90) return "Excellent - Strong command of the subject";
  if (score >= 80) return "Good - Solid understanding with room for improvement";
  if (score >= 70) return "Satisfactory - Adequate knowledge, focus on weak areas";
  if (score >= 60) return "Needs Improvement - Consider additional practice";
  return "Below Expectations - Significant study needed";
}

export default function AssessmentResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await fetch(`/api/aptitude/attempts/${id}/result`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Unable to load assessment result.");
        }

        // Trigger weak skills analysis then refresh the roadmap with the new gaps.
        // Both are fire-and-forget relative to displaying the result; errors are
        // non-fatal so the result page still loads normally.
        await fetch("/api/aptitude/weak-skills/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId: id }),
        }).then((r) => {
          if (r.ok) {
            // Best-effort: update roadmap in the background; don't await
            void fetch("/api/roadmap/refresh", { method: "POST" });
          }
        }).catch(() => {
          // Non-fatal — weak skill analysis failure should not block the results page
        });

        if (mounted) {
          setResult(data);
        }
      } catch (caught) {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load assessment result.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <DashboardHeader title="Assessment Results" subtitle="Loading your performance..." />
        <Panel className="rounded-2xl p-8 text-center text-sm text-muted">
          Loading assessment results...
        </Panel>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader title="Assessment Results" subtitle="Unable to load results" />
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <Link href="/dashboard/aptitude">
          <button className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" />
            Back to Aptitude
          </button>
        </Link>
      </>
    );
  }

  if (!result) return null;

  const { result: assessmentResult, answers } = result;
  const scoreColor = getScoreColor(assessmentResult.score);

  return (
    <>
      <DashboardHeader 
        title="Assessment Results" 
        subtitle={`Completed on ${new Date(assessmentResult.completedAt).toLocaleDateString()}`}
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Overall Score"
          value={`${assessmentResult.score}%`}
          detail="Total performance"
          icon={Trophy}
          accent={scoreColor as any}
        />
        <StatCard
          label="Correct Answers"
          value={assessmentResult.correctAnswers.toString()}
          detail={`of ${assessmentResult.totalQuestions} questions`}
          icon={CheckCircle2}
          accent="success"
        />
        <StatCard
          label="Accuracy"
          value={`${assessmentResult.percentage.toFixed(1)}%`}
          detail="Answer accuracy rate"
          icon={Clock3}
          accent="forge"
        />
        <StatCard
          label="Unanswered"
          value={assessmentResult.unanswered.toString()}
          detail="Questions skipped"
          icon={XCircle}
          accent="warning"
        />
      </div>

      <Panel className="rounded-2xl p-6 mb-6">
        <div className="text-xs tracking-widest text-muted font-mono mb-4">PERFORMANCE INTERPRETATION</div>
        <p className="text-sm text-ink">{getScoreInterpretation(assessmentResult.score)}</p>
      </Panel>

      <WeakSkillsPanel />

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <Panel className="rounded-2xl p-6">
          <div className="text-xs tracking-widest text-muted font-mono mb-4">CATEGORY PERFORMANCE</div>
          <div className="space-y-3">
            {assessmentResult.categoryPerformance.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-ink">{labelFor(cat.category)}</span>
                <span className="text-sm font-semibold text-ink">
                  {cat.correct}/{cat.total} ({cat.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="rounded-2xl p-6">
          <div className="text-xs tracking-widest text-muted font-mono mb-4">DIFFICULTY PERFORMANCE</div>
          <div className="space-y-3">
            {assessmentResult.difficultyPerformance.map((diff) => (
              <div key={diff.difficulty} className="flex items-center justify-between">
                <span className="text-sm text-ink">{labelFor(diff.difficulty)}</span>
                <span className="text-sm font-semibold text-ink">
                  {diff.correct}/{diff.total} ({diff.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="rounded-2xl p-6 mb-6">
        <div className="text-xs tracking-widest text-muted font-mono mb-4">DETAILED ANSWER REVIEW</div>
        <div className="space-y-4">
          {answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={`p-4 rounded-xl border ${
                answer.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full ${
                  answer.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                  {answer.isCorrect ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink mb-1">
                    Question {index + 1}: {answer.question}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted mb-2">
                    <span>{labelFor(answer.category)}</span>
                    <span>•</span>
                    <span>{labelFor(answer.difficulty)}</span>
                    {answer.skill && (
                      <>
                        <span>•</span>
                        <span>Skill: {answer.skill}</span>
                      </>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted">Your answer: </span>
                      <span className={`font-semibold ${answer.isCorrect ? "text-green-700" : "text-red-700"}`}>
                        {answer.selectedAnswer}. {answer.options[answer.selectedAnswer.charCodeAt(0) - 65]}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Correct answer: </span>
                      <span className="font-semibold text-green-700">
                        {answer.correctAnswer}. {answer.options[answer.correctAnswer.charCodeAt(0) - 65]}
                      </span>
                    </div>
                  </div>
                  {answer.explanation && (
                    <p className="mt-2 text-xs text-muted bg-white/50 p-2 rounded">
                      <span className="font-semibold">Explanation: </span>
                      {answer.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Link href="/dashboard/aptitude">
        <button className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-bold text-white hover:bg-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Aptitude Dashboard
        </button>
      </Link>
    </>
  );
}
