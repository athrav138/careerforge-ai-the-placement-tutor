"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Clock3, ExternalLink, RefreshCw, RotateCcw, Trash2, Target, BookOpen, Code2, Mic, FileText, Briefcase, Users, Award } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";

type Action = { id: string; title: string; description: string; category: string; priority: string; reason: string; actionUrl: string | null; estimatedMinutes: number | null; completed: boolean };
type Metric = { score: number; available: boolean; explanation: string };
type Center = { actions: Action[]; readiness: { overallScore: number; metrics: Record<string, Metric>; recommendations: { title: string; detail: string; href: string }[] } };

type PreparationOverview = {
  targetCareer: { id: string | null; title: string | null; domain: string | null; matchPercentage: number | null; matchedSkills: string[]; missingSkills: string[] };
  readinessScore: number;
  weakSkillCount: number;
  completedActivities: { roadmapTasks: number; aptitudeTests: number; interviews: number; projects: number };
  pendingActivities: { roadmapTasks: number; skillGaps: number; recommendedProjects: number; jobMatches: number };
  lastActivity: string | null;
};

type RoleSpecificPreparation = {
  careerId: string | null;
  careerTitle: string | null;
  requiredSkills: string[];
  currentSkillCoverage: number;
  skillGaps: Array<{ skillName: string; gapLevel: string; priority: string }>;
  roadmapProgress: number;
  recommendedPathways: Array<{ category: string; title: string; description: string; href: string }>;
};

type LearningAndPractice = {
  roadmap: { exists: boolean; progress: number; title: string | null; totalTasks: number; completedTasks: number; overdueTasks: number };
  aptitude: { latestScore: number | null; averageScore: number | null; testsCompleted: number; weakCategories: string[] };
  projects: { totalRecommended: number; completed: number; inProgress: number };
  interviews: { completed: number; averageScore: number | null; weakAreas: string[] };
};

type EvidenceAndProgress = {
  resume: { atsScore: number | null; uploaded: boolean; analyzed: boolean; lastAnalyzed: string | null };
  github: { connected: boolean; repositoryCount: number; readmeCount: number; skillEvidenceCount: number };
  linkedin: { imported: boolean; skillCount: number; experienceCount: number; educationCount: number };
  jobApplications: { total: number; applied: number; interview: number; offer: number };
};

type PreparationData = {
  overview: PreparationOverview;
  roleSpecific: RoleSpecificPreparation;
  learning: LearningAndPractice;
  evidence: EvidenceAndProgress;
};

const priorityStyles: Record<string, string> = { HIGH: "border-red-200 bg-red-50 text-red-700", MEDIUM: "border-amber-200 bg-amber-50 text-amber-700", LOW: "border-slate-200 bg-slate-50 text-slate-600" };
const signalLabels: Record<string, string> = { resume: "Resume", skills: "Skills", interview: "Interview", github: "GitHub", linkedin: "LinkedIn", projects: "Projects" };

export default function ActionCenter() {
  const [data, setData] = useState<Center | null>(null);
  const [preparation, setPreparation] = useState<PreparationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (generate = false) => {
    setError("");
    generate ? setBusy(true) : setLoading(true);
    try {
      const [actionResponse, prepResponse] = await Promise.all([
        fetch("/api/action-center", { method: generate ? "POST" : "GET", cache: "no-store" }),
        fetch("/api/placement-preparation", { cache: "no-store" }),
      ]);
      const actionPayload = await actionResponse.json();
      const prepPayload = await prepResponse.json();

      if (!actionResponse.ok) throw new Error(actionPayload.error ?? "Unable to load the action center.");
      if (!prepResponse.ok) throw new Error(prepPayload.error ?? "Unable to load preparation data.");

      setData(generate ? { ...(data ?? {}), actions: actionPayload.actions } as Center : actionPayload);
      setPreparation(prepPayload);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load the action center."); }
    finally { setLoading(false); setBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/action-center", { cache: "no-store" }),
      fetch("/api/placement-preparation", { cache: "no-store" }),
    ])
      .then(async ([actionResponse, prepResponse]) => {
        const actionPayload = await actionResponse.json();
        const prepPayload = await prepResponse.json();

        if (!actionResponse.ok) throw new Error(actionPayload.error ?? "Unable to load the action center.");
        if (!prepResponse.ok) throw new Error(prepPayload.error ?? "Unable to load preparation data.");

        if (!cancelled) {
          setData(actionPayload);
          setPreparation(prepPayload);
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load the action center.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const update = async (id: string, operation: "complete" | "reopen" | "delete") => {
    const method = operation === "delete" ? "DELETE" : "POST";
    const response = await fetch(operation === "delete" ? `/api/action-center/${id}` : `/api/action-center/${id}/${operation}`, { method });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error ?? "Unable to update action."); return; }
    if (operation === "delete") setData((current) => current ? { ...current, actions: current.actions.filter((action) => action.id !== id) } : current);
    else setData((current) => current ? { ...current, actions: current.actions.map((action) => action.id === id ? payload.action : action) } : current);
  };

  const counts = useMemo(() => ({ high: data?.actions.filter((item) => !item.completed && item.priority === "HIGH").length ?? 0, recommended: data?.actions.filter((item) => !item.completed && item.priority !== "HIGH").length ?? 0, completed: data?.actions.filter((item) => item.completed).length ?? 0 }), [data]);
  const active = data?.actions.filter((action) => !action.completed) ?? [];
  const completed = data?.actions.filter((action) => action.completed) ?? [];

  if (loading) return <><DashboardHeader title="Career Action Center" subtitle="Loading your placement priorities..." /><div className="h-64 animate-pulse bg-white rounded-2xl" /></>;

  return <>
    <DashboardHeader title="Placement Preparation Center" subtitle="Your unified preparation overview, role-specific guidance, and evidence-backed priorities." />
    {error && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Placement intelligence</p><p className="mt-1 text-sm text-muted">Complete the next evidence-backed action to improve your placement readiness.</p></div>
      <Button onClick={() => void load(true)} disabled={busy} icon={false}><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> {busy ? "Refreshing" : "Refresh actions"}</Button>
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Panel title="Placement readiness" className="rounded-2xl">
        <div className="p-5"><div className="flex items-end justify-between"><div><p className="text-4xl font-black text-ink">{data?.readiness.overallScore ?? 0}%</p><p className="mt-1 text-sm text-muted">Current readiness across your existing signals</p></div><CheckCircle2 size={34} className="text-cyan" /></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${data?.readiness.overallScore ?? 0}%` }} /></div></div>
      </Panel>
      <Panel title="Today's priorities" className="rounded-2xl"><div className="grid grid-cols-3 divide-x divide-line p-5 text-center"><div><p className="text-2xl font-black text-red-600">{counts.high}</p><p className="text-xs text-muted">High priority</p></div><div><p className="text-2xl font-black text-amber-600">{counts.recommended}</p><p className="text-xs text-muted">Recommended</p></div><div><p className="text-2xl font-black text-emerald-600">{counts.completed}</p><p className="text-xs text-muted">Completed</p></div></div></Panel>
    </div>

    {/* Preparation Overview Section */}
    {preparation && (
      <>
        <Panel title="Preparation Overview" className="mt-5 rounded-2xl">
          <div className="p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Target Career */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-cyan" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Target Career</p>
                </div>
                {preparation.overview.targetCareer.title ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.overview.targetCareer.title}</p>
                    <p className="text-sm text-muted mt-1">{preparation.overview.targetCareer.domain}</p>
                    {preparation.overview.targetCareer.matchPercentage !== null && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted">Match</span>
                          <span className="font-semibold text-cyan">{preparation.overview.targetCareer.matchPercentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-cyan" style={{ width: `${preparation.overview.targetCareer.matchPercentage}%` }} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">No target career selected yet.</p>
                )}
              </div>

              {/* Readiness Score */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={18} className="text-cyan" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Readiness Score</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-4xl font-black text-white">{preparation.overview.readinessScore}%</p>
                    <p className="text-sm text-muted mt-1">Overall placement readiness</p>
                  </div>
                  <CheckCircle2 size={32} className={preparation.overview.readinessScore >= 70 ? "text-emerald-400" : "text-amber-400"} />
                </div>
                {preparation.overview.weakSkillCount > 0 && (
                  <p className="text-sm text-muted mt-2">{preparation.overview.weakSkillCount} skill{preparation.overview.weakSkillCount === 1 ? "" : "s"} need attention</p>
                )}
              </div>
            </div>

            {/* Activity Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">{preparation.overview.completedActivities.roadmapTasks}</p>
                  <p className="text-xs text-muted">Roadmap tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{preparation.overview.completedActivities.aptitudeTests}</p>
                  <p className="text-xs text-muted">Aptitude tests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{preparation.overview.completedActivities.interviews}</p>
                  <p className="text-xs text-muted">Interviews</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{preparation.overview.completedActivities.projects}</p>
                  <p className="text-xs text-muted">Projects</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Role-Specific Preparation */}
        {preparation.roleSpecific.careerTitle && (
          <Panel title="Role-Specific Preparation" className="mt-5 rounded-2xl">
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-muted">Preparing for: <span className="font-semibold text-white">{preparation.roleSpecific.careerTitle}</span></p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Skill Coverage */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted">Skill Coverage</p>
                    <p className="text-sm font-bold text-cyan">{preparation.roleSpecific.currentSkillCoverage}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan" style={{ width: `${preparation.roleSpecific.currentSkillCoverage}%` }} />
                  </div>
                </div>

                {/* Roadmap Progress */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted">Roadmap Progress</p>
                    <p className="text-sm font-bold text-cyan">{preparation.roleSpecific.roadmapProgress}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-cyan" style={{ width: `${preparation.roleSpecific.roadmapProgress}%` }} />
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-muted mb-2">Priority Skill Gaps</p>
                  <p className="text-sm font-bold text-white">{preparation.roleSpecific.skillGaps.length}</p>
                  <p className="text-xs text-muted">skills to improve</p>
                </div>
              </div>

              {/* Recommended Pathways */}
              {preparation.roleSpecific.recommendedPathways.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Recommended Pathways</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {preparation.roleSpecific.recommendedPathways.map((pathway) => (
                      <Link key={pathway.href} href={pathway.href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:border-cyan/30 hover:bg-white/10 transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                          {pathway.category === "SKILL" && <BookOpen size={16} />}
                          {pathway.category === "ROADMAP" && <Target size={16} />}
                          {pathway.category === "CAREER" && <Briefcase size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{pathway.title}</p>
                          <p className="text-xs text-muted truncate">{pathway.description}</p>
                        </div>
                        <ExternalLink size={14} className="text-muted shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Learning & Practice */}
        <Panel title="Learning & Practice" className="mt-5 rounded-2xl">
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Roadmap */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-cyan" />
                  <p className="text-xs font-semibold text-muted">Roadmap</p>
                </div>
                {preparation.learning.roadmap.exists ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.learning.roadmap.progress}%</p>
                    <p className="text-xs text-muted mt-1">{preparation.learning.roadmap.completedTasks} of {preparation.learning.roadmap.totalTasks} tasks</p>
                    {preparation.learning.roadmap.overdueTasks > 0 && (
                      <p className="text-xs text-amber-400 mt-2">{preparation.learning.roadmap.overdueTasks} overdue</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">No roadmap generated</p>
                )}
              </div>

              {/* Aptitude */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={18} className="text-cyan" />
                  <p className="text-xs font-semibold text-muted">Aptitude</p>
                </div>
                {preparation.learning.aptitude.testsCompleted > 0 ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.learning.aptitude.averageScore ?? 0}%</p>
                    <p className="text-xs text-muted mt-1">{preparation.learning.aptitude.testsCompleted} tests completed</p>
                    {preparation.learning.aptitude.weakCategories.length > 0 && (
                      <p className="text-xs text-amber-400 mt-2">Weak: {preparation.learning.aptitude.weakCategories.join(", ")}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">No tests taken</p>
                )}
              </div>

              {/* Projects */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 size={18} className="text-cyan" />
                  <p className="text-xs font-semibold text-muted">Projects</p>
                </div>
                {preparation.learning.projects.totalRecommended > 0 ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.learning.projects.completed}</p>
                    <p className="text-xs text-muted mt-1">of {preparation.learning.projects.totalRecommended} completed</p>
                    {preparation.learning.projects.inProgress > 0 && (
                      <p className="text-xs text-cyan mt-2">{preparation.learning.projects.inProgress} in progress</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">No projects recommended</p>
                )}
              </div>

              {/* Interviews */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mic size={18} className="text-cyan" />
                  <p className="text-xs font-semibold text-muted">Interviews</p>
                </div>
                {preparation.learning.interviews.completed > 0 ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.learning.interviews.averageScore ?? 0}%</p>
                    <p className="text-xs text-muted mt-1">{preparation.learning.interviews.completed} completed</p>
                    {preparation.learning.interviews.weakAreas.length > 0 && (
                      <p className="text-xs text-amber-400 mt-2">Focus: {preparation.learning.interviews.weakAreas.join(", ")}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">No interviews taken</p>
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* Evidence & Progress */}
        <Panel title="Evidence & Progress" className="mt-5 rounded-2xl">
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Resume */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={18} className={preparation.evidence.resume.analyzed ? "text-emerald-400" : "text-muted"} />
                  <p className="text-xs font-semibold text-muted">Resume</p>
                </div>
                {preparation.evidence.resume.analyzed ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.evidence.resume.atsScore}%</p>
                    <p className="text-xs text-muted mt-1">ATS score</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">{preparation.evidence.resume.uploaded ? "Pending analysis" : "Not uploaded"}</p>
                )}
              </div>

              {/* GitHub */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 size={18} className={preparation.evidence.github.connected ? "text-emerald-400" : "text-muted"} />
                  <p className="text-xs font-semibold text-muted">GitHub</p>
                </div>
                {preparation.evidence.github.connected ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.evidence.github.repositoryCount}</p>
                    <p className="text-xs text-muted mt-1">repositories</p>
                    <p className="text-xs text-muted">{preparation.evidence.github.readmeCount} with README</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">Not connected</p>
                )}
              </div>

              {/* LinkedIn */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className={preparation.evidence.linkedin.imported ? "text-emerald-400" : "text-muted"} />
                  <p className="text-xs font-semibold text-muted">LinkedIn</p>
                </div>
                {preparation.evidence.linkedin.imported ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.evidence.linkedin.skillCount}</p>
                    <p className="text-xs text-muted mt-1">skills</p>
                    <p className="text-xs text-muted">{preparation.evidence.linkedin.experienceCount} experience</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">Not imported</p>
                )}
              </div>

              {/* Job Applications */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={18} className="text-cyan" />
                  <p className="text-xs font-semibold text-muted">Applications</p>
                </div>
                {preparation.evidence.jobApplications.total > 0 ? (
                  <>
                    <p className="text-xl font-bold text-white">{preparation.evidence.jobApplications.applied}</p>
                    <p className="text-xs text-muted mt-1">applied</p>
                    <p className="text-xs text-muted">{preparation.evidence.jobApplications.interview} interviews</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">No applications</p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </>
    )}

    <Panel title="Priority actions" className="mt-5 rounded-2xl">
      <div className="divide-y divide-line">{active.length ? active.map((action) => <ActionRow key={action.id} action={action} onUpdate={update} />) : <div className="p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-500" /><p className="mt-3 font-semibold text-ink">You are caught up.</p><p className="mt-1 text-sm text-muted">Refresh after completing work in another module to find the next action.</p></div>}</div>
    </Panel>
    <Panel title="Career signals" className="mt-5 rounded-2xl"><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(signalLabels).map(([key, label]) => { const metric = data?.readiness.metrics[key]; return <div key={key}><div className="flex justify-between text-sm"><span className="font-semibold text-ink">{label}</span><span className="text-muted">{metric?.available ? `${metric.score}%` : "Not measured"}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan" style={{ width: `${metric?.score ?? 0}%` }} /></div></div>; })}</div></Panel>
    <Panel title="Completed history" className="mt-5 rounded-2xl"><div className="divide-y divide-line">{completed.length ? completed.map((action) => <ActionRow key={action.id} action={action} onUpdate={update} />) : <p className="p-5 text-sm text-muted">Completed actions will appear here.</p>}</div></Panel>
  </>;
}

function ActionRow({ action, onUpdate }: { action: Action; onUpdate: (id: string, operation: "complete" | "reopen" | "delete") => Promise<void> }) {
  return <div className={`p-5 ${action.completed ? "opacity-70" : ""}`}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${priorityStyles[action.priority] ?? priorityStyles.LOW}`}>{action.priority}</span><span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{action.category}</span></div><h3 className={`mt-2 text-base font-bold text-ink ${action.completed ? "line-through" : ""}`}>{action.title}</h3><p className="mt-1 text-sm leading-6 text-muted">{action.description}</p><p className="mt-2 text-xs text-slate-500"><strong>Why:</strong> {action.reason}</p>{action.estimatedMinutes && <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan"><Clock3 size={13} /> {action.estimatedMinutes} minutes</p>}</div><div className="flex shrink-0 flex-wrap items-center gap-2">{action.actionUrl && !action.completed && <Link href={action.actionUrl} className="inline-flex items-center gap-1 rounded-xl bg-cyan px-3 py-2 text-xs font-semibold text-white">Start <ExternalLink size={13} /></Link>}{action.completed ? <button onClick={() => void onUpdate(action.id, "reopen")} className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink"><RotateCcw size={13} /> Reopen</button> : <button onClick={() => void onUpdate(action.id, "complete")} className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700"><Check size={13} /> Complete</button>}<button aria-label="Delete action" title="Delete action" onClick={() => void onUpdate(action.id, "delete")} className="rounded-xl border border-line p-2 text-muted hover:text-red-600"><Trash2 size={14} /></button></div></div></div>;
}
