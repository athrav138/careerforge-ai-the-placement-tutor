"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  GraduationCap,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";

type Metric = { score: number; available: boolean; explanation: string };
type PreparationItem = {
  id: string;
  title: string;
  description: string;
  reason: string;
  href: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  estimatedMinutes: number | null;
};
type Preparation = {
  targetCareer: string | null;
  careerAnalysis: { role: string; matchPercentage: number; missingSkills: string[] } | null;
  readiness: { overallScore: number; weakSkillCount: number; metrics: Record<string, Metric> };
  roadmap: { title: string; status: string; progress: number; openTaskCount: number; completedTaskCount: number; overdueTaskCount: number } | null;
  actions: { totalOpen: number; highPriority: number; completed: number; items: PreparationItem[] };
};

const moduleLinks = [
  { href: "/dashboard/career", label: "Career fit", detail: "Compare your saved skills with a target role", icon: Target },
  { href: "/dashboard/roadmap", label: "Learning roadmap", detail: "Continue planned learning tasks", icon: BookOpenCheck },
  { href: "/dashboard/resume", label: "Resume & ATS", detail: "Review your available resume feedback", icon: FileText },
  { href: "/dashboard/aptitude", label: "Aptitude practice", detail: "Build quantitative and reasoning skills", icon: TrendingUp },
  { href: "/dashboard/interview", label: "Interview practice", detail: "Prepare with technical and HR mock rounds", icon: GraduationCap },
  { href: "/dashboard/jobs", label: "Job matching", detail: "Review matching opportunities", icon: BriefcaseBusiness },
];

const priorityStyle: Record<string, string> = {
  HIGH: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  MEDIUM: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  LOW: "border-white/15 bg-white/5 text-slate-300",
};

export default function PlacementPreparationPage() {
  const [data, setData] = useState<Preparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(refresh = false, regenerate = false) {
    setError("");
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (regenerate) {
        const generated = await fetch("/api/action-center", { method: "POST", cache: "no-store" });
        const generatedPayload = await generated.json();
        if (!generated.ok) {
          throw new Error(generatedPayload.error ?? "Unable to refresh preparation priorities.");
        }
      }

      const response = await fetch("/api/placement-preparation", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load placement preparation.");
      setData(payload as Preparation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load placement preparation.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <DashboardHeader
        title="Placement Preparation"
        subtitle="One focused workspace for your target role, current evidence, and next preparation actions."
      />
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-5" aria-label="Loading placement preparation">
          <div className="h-36 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : data ? (
        <>
          <section className="mb-6 rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/10 via-white/[0.02] to-transparent p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan">
                  <Flame size={15} /> Placement intelligence
                </div>
                <h2 className="text-2xl font-black text-white md:text-3xl">
                  {data.targetCareer ? `Your path to ${data.targetCareer}` : "Build your placement preparation plan"}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  {data.careerAnalysis
                    ? `Your latest career analysis shows a ${data.careerAnalysis.matchPercentage}% match. Use the evidence below to decide what to work on next.`
                    : "Choose a target career and run a career analysis to unlock role-specific priorities. You can still use the preparation modules below."}
                </p>
              </div>
              <Button onClick={() => void load(true, true)} disabled={refreshing} icon={false}>
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh priorities"}
              </Button>
            </div>
          </section>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Readiness index" value={`${data.readiness.overallScore}%`} detail="Weighted from available preparation signals" />
            <SummaryCard label="High-priority actions" value={String(data.actions.highPriority)} detail="Open actions ranked high by existing rules" />
            <SummaryCard label="Skill gaps" value={String(data.careerAnalysis?.missingSkills.length ?? data.readiness.weakSkillCount)} detail={data.careerAnalysis ? "Missing skills in the latest target-role analysis" : "Weak or critical assessed skills"} />
            <SummaryCard label="Roadmap progress" value={data.roadmap ? `${data.roadmap.progress}%` : "—"} detail={data.roadmap ? `${data.roadmap.completedTaskCount} completed · ${data.roadmap.openTaskCount} remaining` : "Create a roadmap to track learning"} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel title="Your next best actions" className="rounded-2xl">
              <div className="divide-y divide-line">
                {data.actions.items.length ? data.actions.items.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${priorityStyle[item.priority] ?? priorityStyle.MEDIUM}`}>
                            {item.priority} priority
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{item.category.replaceAll("_", " ")}</span>
                          {item.estimatedMinutes !== null && <span className="inline-flex items-center gap-1 text-xs text-muted"><Clock3 size={12} /> {item.estimatedMinutes} min</span>}
                        </div>
                        <h3 className="mt-2 font-bold text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-400"><strong className="text-slate-300">Why this matters:</strong> {item.reason}</p>
                      </div>
                      <Link href={item.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110">
                        Continue <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="mx-auto text-cyan" size={28} />
                    <h3 className="mt-3 font-bold text-white">No open priority actions</h3>
                    <p className="mt-1 text-sm text-slate-300">Refresh priorities to recalculate actions from your latest preparation records.</p>
                    <Link href="/dashboard/action-center" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white">
                      Open Career Action Center <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </Panel>

            <div className="space-y-5">
              <Panel title="Preparation evidence" className="rounded-2xl">
                <div className="space-y-4 p-5">
                  {Object.entries(data.readiness.metrics).map(([key, metric]) => (
                    <div key={key}>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold capitalize text-white">{key.replaceAll(/([A-Z])/g, " $1")}</span>
                        <span className={`text-xs font-bold ${metric.available ? "text-cyan" : "text-slate-500"}`}>
                          {metric.available ? `${metric.score}%` : "Not measured"}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${Math.max(0, Math.min(100, metric.score))}%` }} />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{metric.explanation}</p>
                    </div>
                  ))}
                  <p className="border-t border-white/10 pt-3 text-xs leading-5 text-slate-400">
                    Only recorded signals are labelled as measured. This index supports preparation decisions; it does not predict or guarantee placement.
                  </p>
                </div>
              </Panel>

              <Panel title="Role and roadmap" className="rounded-2xl">
                <div className="space-y-4 p-5">
                  {data.careerAnalysis ? (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted">Latest role analysis</p>
                      <p className="mt-1 text-lg font-black text-white">{data.careerAnalysis.role}</p>
                      <p className="mt-1 text-sm text-slate-300">{data.careerAnalysis.missingSkills.length} role skills still need evidence.</p>
                    </div>
                  ) : <p className="text-sm text-slate-300">No saved career analysis yet.</p>}
                  {data.roadmap ? (
                    <div className="rounded-xl border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-white">{data.roadmap.title}</span><span className="text-xs text-cyan">{data.roadmap.progress}%</span></div>
                      <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan" style={{ width: `${Math.max(0, Math.min(100, data.roadmap.progress))}%` }} /></div>
                      {data.roadmap.overdueTaskCount > 0 && <p className="mt-2 text-xs text-amber-200">{data.roadmap.overdueTaskCount} unfinished tasks are past their due date.</p>}
                    </div>
                  ) : <p className="text-sm text-slate-400">No learning roadmap found yet.</p>}
                  <Link href="/dashboard/career" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:underline">Review career fit <ArrowRight size={14} /></Link>
                </div>
              </Panel>
            </div>
          </div>

          <Panel title="Continue preparation" className="mt-6 rounded-2xl">
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {moduleLinks.map((module) => {
                const Icon = module.icon;
                return (
                  <Link key={module.href} href={module.href} className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-cyan/30 hover:bg-cyan/5">
                    <Icon size={20} className="text-cyan" />
                    <h3 className="mt-3 font-bold text-white group-hover:text-cyan">{module.label}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{module.detail}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan">Open module <ArrowRight size={12} /></span>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </>
      ) : null}
    </>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Panel className="rounded-2xl p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </Panel>
  );
}
