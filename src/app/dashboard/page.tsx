"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Code2,
  LineChart,
  Briefcase,
  Mic,
  Target,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import ScoreBar from "@/components/ui/score-bar";
import { getSession } from "@/lib/auth";
import ProfileCard from "@/components/dashboard/widgets/profile-card";
import ReadinessPanel from "@/components/dashboard/widgets/readiness-panel";
import StatCard from "@/components/dashboard/stat-card";
import WeakSkillsPanel from "@/components/aptitude/WeakSkillsPanel";

const actions = [
  { title: "Complete aptitude sprint", body: "Focus on probability, time and work, and logical puzzles.", href: "/dashboard/aptitude", icon: LineChart },
  { title: "Improve resume keywords", body: "Tune your profile for the role you want next.", href: "/dashboard/resume", icon: FileText },
  { title: "Start a mock interview", body: "Practice technical and HR prompts with AI feedback.", href: "/dashboard/interview", icon: Mic },
];

const quickLinks = [
  { href: "/dashboard/career", label: "CAREER MATCH", title: "Strong fit detected", icon: BriefcaseBusiness },
  { href: "/dashboard/skills", label: "TOP GAP", title: "Review your saved skills", icon: Target },
  { href: "/dashboard/interview", label: "INTERVIEW PREP", title: "Start your first mock round", icon: Mic },
  { href: "/dashboard/github", label: "GITHUB", title: "Connect your portfolio", icon: Code2 },
  { href: "/dashboard/linkedin", label: "LINKEDIN", title: "Import your profile", icon: Briefcase },
];

type Readiness = {
  overallScore: number;
  weakSkillCount: number;
  metrics: {
    career: { score: number; explanation: string };
    skills: { score: number; explanation: string };
    resume: { score: number; explanation: string };
    aptitude: { score: number; explanation: string };
    interview: { score: number; explanation: string };
    learning: { score: number; explanation: string };
    projects: { score: number; explanation: string };
    github: { score: number; explanation: string };
    linkedin: { score: number; explanation: string };
  };
  recommendations: { id: string; title: string; detail: string; href: string }[];
};

export default function Dashboard() {
  const [userName, setUserName] = useState("Student");
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [summary, setSummary] = useState<{
    careerFit: number;
    skillCount: number;
    skills: string[];
    resumeScore?: number | null;
    analysis?: { career: string; matchedSkills: string[]; missingSkills: string[]; recommendations: string[] } | null;
  } | null>(null);
  const [roadmap, setRoadmap] = useState<{ progress: number; title: string; tasks: { title: string; status: string }[] } | null>(null);
  const [aptitudeSummary, setAptitudeSummary] = useState<{
    latestScore: number | null;
    averageScore: number | null;
    testsCompleted: number;
    accuracy: number | null;
  } | null>(null);
  const [professionalConnections, setProfessionalConnections] = useState<{
    github: boolean;
    linkedin: boolean;
  }>({ github: false, linkedin: false });

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setUserName(session.name);
      }
    });
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { summary?: typeof summary }) => setSummary(data.summary ?? null));
    fetch("/api/roadmap", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { roadmap?: typeof roadmap | null }) => setRoadmap(data.roadmap ?? null));
    fetch("/api/aptitude/summary", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as NonNullable<typeof aptitudeSummary>;
        setAptitudeSummary(data);
      });
    fetch("/api/readiness", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        setReadiness((await response.json()) as Readiness);
      });
    Promise.all([
      fetch("/api/github/profile").then(res => ({ github: res.ok })).catch(() => ({ github: false })),
      fetch("/api/linkedin/profile").then(res => ({ linkedin: res.ok })).catch(() => ({ linkedin: false })),
    ]).then(([githubStatus, linkedinStatus]) => {
      setProfessionalConnections({ github: githubStatus.github, linkedin: linkedinStatus.linkedin });
    });
  }, []);

  const careerFit = summary?.careerFit ?? 0;
  const skillsScore = summary?.analysis
    ? Math.round((summary.analysis.matchedSkills.length / Math.max(1, summary.analysis.matchedSkills.length + summary.analysis.missingSkills.length)) * 100)
    : Math.min(95, summary ? summary.skillCount * 10 : 0);

  const dashboardActions = summary?.analysis?.recommendations.length
    ? summary.analysis.recommendations.slice(0, 3).map((recommendation) => ({
        title: recommendation,
        body: `Close this gap for ${summary.analysis?.career ?? "your target role"}.`,
        href: "/dashboard/career",
        icon: Target,
      }))
    : actions;

  const readinessStats = [
    { label: "Readiness Index", value: readiness ? `${readiness.overallScore}%` : "--", detail: "Weighted placement preparation score", icon: Target, accent: "cyan" as const },
    { label: "Resume ATS Match", value: readiness ? `${readiness.metrics.resume.score}%` : "--", detail: readiness?.metrics.resume.explanation ?? "Add a resume to calculate", icon: FileText, accent: "forge" as const },
    { label: "Aptitude Mastery", value: readiness ? `${readiness.metrics.aptitude.score}%` : "--", detail: readiness?.metrics.aptitude.explanation ?? "Complete an assessment to calculate", icon: LineChart, accent: "success" as const },
    { label: "Weak Skills", value: readiness ? String(readiness.weakSkillCount) : "--", detail: "Skills currently marked weak or critical", icon: BarChart3, accent: "warning" as const },
  ];

  const actionableItems = readiness?.recommendations.length
    ? readiness.recommendations.slice(0, 3).map((recommendation) => ({ title: recommendation.title, body: recommendation.detail, href: recommendation.href, icon: Target }))
    : dashboardActions;

  return (
    <>
      <DashboardHeader title={`Welcome back, ${userName}`} subtitle="Here's where your placement preparation stands." />

      {/* Main 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {readinessStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Aptitude Performance Telemetry */}
      <Panel className="mb-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-[#00f0ff] font-mono font-semibold">APTITUDE PERFORMANCE</div>
            <h2 className="mt-2 text-xl font-black text-white">Assessment Telemetry</h2>
          </div>
          <Link
            href="/dashboard/aptitude"
            className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-mono font-semibold"
          >
            <span>Launch Tests</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Latest score",
              value: aptitudeSummary?.latestScore == null ? "—" : `${aptitudeSummary.latestScore}%`,
            },
            {
              label: "Average score",
              value: aptitudeSummary?.averageScore == null ? "—" : `${aptitudeSummary.averageScore}%`,
            },
            {
              label: "Tests completed",
              value: String(aptitudeSummary?.testsCompleted ?? 0),
            },
            {
              label: "Accuracy rate",
              value: aptitudeSummary?.accuracy == null ? "—" : `${aptitudeSummary.accuracy}%`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-400 font-medium">{item.label}</div>
              <div className="mt-1 text-2xl font-black font-mono text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Student Profile + Readiness Snapshot */}
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 mb-6">
        <ProfileCard />
        <ReadinessPanel readiness={readiness} />
      </div>

      {/* Professional Evidence (GitHub & LinkedIn) */}
      <Panel className="mb-6 rounded-2xl p-6">
        <div className="mb-5">
          <div className="text-xs tracking-widest text-[#00f0ff] font-mono font-semibold">PROFESSIONAL EVIDENCE</div>
          <h2 className="mt-2 text-xl font-black text-white">Connected Portfolios & Profiles</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`rounded-xl border p-5 transition-all ${
            professionalConnections.github
              ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-white/10 bg-white/5"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Code2 className={professionalConnections.github ? "text-emerald-400" : "text-slate-400"} size={22} />
                <span className="font-bold text-white text-base">GitHub Portfolio</span>
              </div>
              {professionalConnections.github ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Synchronized</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Not connected</span>
              )}
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {professionalConnections.github
                ? "Your GitHub repositories and commit telemetry are actively integrated into your technical readiness score."
                : "Connect your GitHub account to verify projects, commit frequency, and core language proficiency."}
            </p>
            <Link
              href="/dashboard/github"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#00f0ff] hover:underline"
            >
              <span>{professionalConnections.github ? "View GitHub Telemetry" : "Connect GitHub"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={`rounded-xl border p-5 transition-all ${
            professionalConnections.linkedin
              ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-white/10 bg-white/5"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Briefcase className={professionalConnections.linkedin ? "text-emerald-400" : "text-slate-400"} size={22} />
                <span className="font-bold text-white text-base">LinkedIn Profile</span>
              </div>
              {professionalConnections.linkedin ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Imported</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Not connected</span>
              )}
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              {professionalConnections.linkedin
                ? "Your professional experience, certifications, and endorsements are synced to your career profile."
                : "Import your LinkedIn profile to validate work history, leadership experience, and endorsements."}
            </p>
            <Link
              href="/dashboard/linkedin"
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#00f0ff] hover:underline"
            >
              <span>{professionalConnections.linkedin ? "View LinkedIn Details" : "Import LinkedIn"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Panel>

      <WeakSkillsPanel />

      {/* Component Scores Breakdown */}
      <Panel className="p-6 mb-6 rounded-2xl">
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs tracking-widest text-[#00f0ff] font-mono font-semibold">COMPONENT SCORES</div>
            <h2 className="mt-2 text-xl font-black text-white">Full Preparation Breakdown</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <BrainCircuit size={20} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ScoreBar label="Career Match" value={readiness?.metrics.career.score ?? careerFit} accent="#00f0ff" />
          <ScoreBar label="Resume ATS" value={readiness?.metrics.resume.score ?? 0} accent="#3b82f6" />
          <ScoreBar label="Technical Skills" value={readiness?.metrics.skills.score ?? skillsScore} accent="#10b981" />
          <ScoreBar label="Interview Confidence" value={readiness?.metrics.interview.score ?? 0} accent="#f59e0b" />
          <ScoreBar label="Aptitude Mastery" value={readiness?.metrics.aptitude.score ?? aptitudeSummary?.latestScore ?? 0} accent="#8b5cf6" />
          <ScoreBar label="Roadmap Progress" value={readiness?.metrics.learning.score ?? roadmap?.progress ?? 0} accent="#00f0ff" />
          <ScoreBar label="Engineering Projects" value={readiness?.metrics.projects.score ?? 0} accent="#ec4899" />
          <ScoreBar label="GitHub Contributions" value={readiness?.metrics.github.score ?? 0} accent="#06b6d4" />
          <ScoreBar label="LinkedIn Endorsements" value={readiness?.metrics.linkedin.score ?? 0} accent="#0284c7" />
        </div>
      </Panel>

      {/* Actionable Recommendations */}
      <Panel className="p-6 mb-6 rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-[#00f0ff] font-mono font-semibold">RECOMMENDED ACTIONS</div>
            <h2 className="mt-2 text-xl font-black text-white">Next Best Moves</h2>
          </div>
          <CheckCircle2 size={22} className="text-emerald-400" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {actionableItems.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#00f0ff]/40 hover:bg-white/[0.08] hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#00f0ff]" />
                </div>
                <h3 className="font-bold text-white text-base">{action.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{action.body}</p>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* Quick Access Grid */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Panel className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#00f0ff]/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]">
                <Icon size={18} className="mb-3 text-[#00f0ff]" />
                <div className="text-xs text-slate-400 font-mono mb-1">{item.label}</div>
                <div className="font-bold text-white text-sm">
                  {item.label === "CAREER MATCH" && summary ? `${careerFit}% fit for ${summary.analysis?.career ?? "your profile"}` : item.label === "TOP GAP" && summary ? summary.analysis?.missingSkills[0] ?? `${summary.skillCount} saved skills` : item.title}
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </>
  );
}
