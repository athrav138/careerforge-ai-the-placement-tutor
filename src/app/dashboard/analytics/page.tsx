"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import Panel from "@/components/ui/panel";
import ScoreBar from "@/components/ui/score-bar";
import { Activity, BarChart3, LineChart, Target, Calendar, TrendingUp, AlertCircle, Mic, Code2, Briefcase, FileText } from "lucide-react";

type ReadinessMetric = {
  score: number;
  available: boolean;
  explanation: string;
};

type ReadinessProfile = {
  overallScore: number;
  metrics: Record<string, ReadinessMetric>;
  weakSkillCount: number;
  computedAt: string;
};

type AnalyticsData = {
  readiness: ReadinessProfile;
  historical: {
    snapshots: Array<{ date: string; overallScore: number }>;
    change: number | null;
  };
  activity: {
    totalLast30Days: number;
    activeDaysLast7: number;
    byDayLast7: Array<{ date: string; count: number }>;
  };
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
  recentActivity: Array<{
    type: string;
    title: string;
    category: string;
    timestamp: string;
  }>;
  generatedAt: string;
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load analytics data.");
        const payload = await response.json();
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load analytics data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <>
        <DashboardHeader title="Readiness analytics" subtitle="Loading your progress insights..." />
        <div className="h-64 animate-pulse bg-white/10 rounded-2xl" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader title="Readiness analytics" subtitle="Progress insights across your placement preparation." />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <DashboardHeader title="Readiness analytics" subtitle="Progress insights across your placement preparation." />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-muted">No analytics data available.</p>
        </div>
      </>
    );
  }

  const metrics = [
    {
      label: "Readiness",
      value: `${data.readiness.overallScore}%`,
      detail: data.historical.change !== null
        ? (data.historical.change > 0 ? `+${data.historical.change} points` : `${data.historical.change} points`)
        : "No trend data",
      icon: Target,
      accent: "cyan" as const,
    },
    {
      label: "Active Days",
      value: `${data.activity.activeDaysLast7}/7`,
      detail: "Days with activity this week",
      icon: Calendar,
      accent: "success" as const,
    },
    {
      label: "Practice Sessions",
      value: String(data.activity.totalLast30Days),
      detail: "Recorded sessions last 30 days",
      icon: Activity,
      accent: "forge" as const,
    },
  ];

  const breakdown = [
    { label: "Career", value: data.readiness.metrics.career.score, available: data.readiness.metrics.career.available },
    { label: "Skills", value: data.readiness.metrics.skills.score, available: data.readiness.metrics.skills.available },
    { label: "Resume", value: data.readiness.metrics.resume.score, available: data.readiness.metrics.resume.available },
    { label: "Aptitude", value: data.readiness.metrics.aptitude.score, available: data.readiness.metrics.aptitude.available },
    { label: "Interview", value: data.readiness.metrics.interview.score, available: data.readiness.metrics.interview.available },
    { label: "Learning", value: data.readiness.metrics.learning.score, available: data.readiness.metrics.learning.available },
    { label: "Projects", value: data.readiness.metrics.projects.score, available: data.readiness.metrics.projects.available },
    { label: "GitHub", value: data.readiness.metrics.github.score, available: data.readiness.metrics.github.available },
    { label: "LinkedIn", value: data.readiness.metrics.linkedin.score, available: data.readiness.metrics.linkedin.available },
  ];

  return (
    <>
      <DashboardHeader title="Readiness analytics" subtitle="Progress insights across your placement preparation." />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* Readiness Trend */}
      <Panel className="mb-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted font-mono">READINESS TREND</div>
            <h2 className="mt-2 text-xl font-black text-white">Historical readiness</h2>
          </div>
          <LineChart className="text-cyan" size={22} />
        </div>
        {data.historical.snapshots.length > 0 ? (
          <div className="space-y-2">
            {data.historical.snapshots.map((snapshot) => (
              <div key={snapshot.date} className="flex items-center gap-4">
                <span className="text-sm text-muted w-24">{snapshot.date}</span>
                <div className="flex-1 h-3 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan transition-all"
                    style={{ width: `${snapshot.overallScore}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-12 text-right">{snapshot.overallScore}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted">
            <AlertCircle size={20} />
            <p className="text-sm">No historical snapshots available. History will appear after you visit the dashboard daily.</p>
          </div>
        )}
      </Panel>

      {/* Weekly Activity */}
      <Panel className="mb-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted font-mono">WEEKLY ACTIVITY</div>
            <h2 className="mt-2 text-xl font-black text-white">Preparation by day</h2>
          </div>
          <Activity className="text-cyan" size={22} />
        </div>
        <div className="space-y-2">
          {data.activity.byDayLast7.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm text-muted w-24">{day.date}</span>
              <div className="flex-1 h-3 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan transition-all"
                  style={{ width: `${Math.min(day.count * 10, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-white w-12 text-right">{day.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Readiness by Component */}
      <Panel className="mb-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted font-mono">READINESS BY COMPONENT</div>
            <h2 className="mt-2 text-xl font-black text-white">Component breakdown</h2>
          </div>
          <BarChart3 className="text-cyan" size={22} />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-white">{item.label}</span>
                <span className={item.available ? "text-cyan" : "text-muted"}>
                  {item.available ? `${item.value}%` : "Not measured"}
                </span>
              </div>
              {item.available ? (
                <ScoreBar label={item.label} value={item.value} accent="#00f0ff" />
              ) : (
                <div className="h-2 rounded-full bg-slate-100" />
              )}
              <p className="text-xs text-muted mt-1">{data.readiness.metrics[item.label.toLowerCase() as keyof typeof data.readiness.metrics]?.explanation || "Not measured"}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent Activity */}
      <Panel className="rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-muted font-mono">RECENT ACTIVITY</div>
            <h2 className="mt-2 text-xl font-black text-white">Your preparation log</h2>
          </div>
          <TrendingUp className="text-cyan" size={22} />
        </div>
        {data.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                  {activity.category === "APTITUDE" && <Activity size={16} />}
                  {activity.category === "INTERVIEW" && <Mic size={16} />}
                  {activity.category === "ROADMAP" && <Target size={16} />}
                  {activity.category === "PROJECT" && <Code2 size={16} />}
                  {activity.category === "CAREER" && <Briefcase size={16} />}
                  {activity.category === "RESUME" && <FileText size={16} />}
                  {!["APTITUDE", "INTERVIEW", "ROADMAP", "PROJECT", "CAREER", "RESUME"].includes(activity.category) && <Activity size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{activity.title}</p>
                  <p className="text-xs text-muted mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity size={32} className="text-muted mb-3" />
            <p className="text-white font-semibold">No recent activity</p>
            <p className="text-sm text-muted mt-1">Complete assessments, interviews, or roadmap tasks to see your activity here.</p>
          </div>
        )}
      </Panel>
    </>
  );
}
