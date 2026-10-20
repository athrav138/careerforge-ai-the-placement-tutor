"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw, Target } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import Panel from "@/components/ui/panel";
import { filterReadinessHistory, requestReadinessAnalytics, type AnalyticsPayload, type ReadinessMetricKey } from "@/lib/readiness-analytics";

const labels: Record<ReadinessMetricKey, string> = {
  career: "Career alignment",
  skills: "Technical skills",
  resume: "Resume",
  aptitude: "Aptitude",
  interview: "Interview practice",
  learning: "Roadmap progress",
  projects: "Project evidence",
  github: "GitHub evidence",
  linkedin: "LinkedIn evidence",
};
const metricKeys = Object.keys(labels) as ReadinessMetricKey[];
type Range = "30" | "90" | "all";

const completedMetrics: Array<{ key: keyof AnalyticsPayload["completedCounts"]; label: string }> = [
  { key: "assessments", label: "Assessments" },
  { key: "aptitude", label: "Aptitude attempts" },
  { key: "interviews", label: "Mock interviews" },
  { key: "roadmapTasks", label: "Roadmap tasks" },
  { key: "projects", label: "Projects completed" },
  { key: "actions", label: "Actions completed" },
  { key: "careerAnalyses", label: "Career analyses" },
  { key: "resumeAnalyses", label: "Resume analyses" },
];

export default function Analytics() {
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>("90");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPayload(await requestReadinessAnalytics());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    requestReadinessAnalytics().then((data) => {
      if (active) setPayload(data);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const visibleHistory = useMemo(() => {
    const snapshots = payload?.historical.snapshots.map((item) => ({ date: item.date, readiness: item.overallScore })) ?? [];
    const cutoff = range === "all" ? Number.NEGATIVE_INFINITY : Date.parse(payload?.generatedAt ?? "") - Number(range) * 86400000;
    return filterReadinessHistory(snapshots, cutoff);
  }, [payload, range]);
  const availableCount = payload ? metricKeys.filter((key) => payload.readiness.metrics[key].available).length : 0;

  return <>
    <DashboardHeader title="Readiness analytics" subtitle="Progress insights from your saved placement preparation data." />
    {error ? <Panel className="mb-6 rounded-2xl p-6"><div role="alert">
      <h2 className="text-lg font-bold text-white">Analytics unavailable</h2>
      <p className="mt-2 text-sm text-slate-300">Analytics could not be loaded. Check your connection and retry.</p>
      <button type="button" onClick={() => void refresh()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/40 px-4 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/10"><RefreshCw size={16} aria-hidden="true" />Retry</button>
    </div></Panel> : loading ? <div aria-label="Loading readiness analytics" aria-busy="true" className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}</div><div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    </div> : payload ? <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Readiness score" value={`${payload.readiness.overallScore}%`} detail={payload.historical.change === null ? "No earlier snapshots to compare." : `${payload.historical.change > 0 ? "+" : ""}${payload.historical.change} points across saved snapshots.`} icon={Target} accent="cyan" />
        <StatCard label="Active days" value={`${payload.activity.activeDaysLast7}/7`} detail="Days with recorded preparation activity in the last week." icon={Activity} accent="forge" />
        <StatCard label="Measured areas" value={`${availableCount}/${metricKeys.length}`} detail="Components with supporting data for this calculation." icon={Target} accent="warning" />
      </div>

      <Panel className="mb-6 rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs tracking-widest text-cyan-200">PERSISTED READINESS HISTORY</p><h2 className="mt-2 text-xl font-black text-white">Recorded readiness snapshots</h2><p className="mt-2 max-w-2xl text-sm text-slate-400">The line shows scores saved for your profile. Readiness uses the documented weighted component formula; areas without evidence contribute zero to the overall score and are labeled unavailable below.</p></div>
          <label className="text-sm text-slate-300">Time range<select value={range} onChange={(event) => setRange(event.target.value as Range)} className="mt-1 block min-h-11 w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 text-white sm:w-44"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All available</option></select></label>
        </div>
        {visibleHistory.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center"><p className="font-semibold text-white">No readiness history in this range</p><p className="mt-2 text-sm text-slate-400">{payload.historical.snapshots.length ? "Choose a wider time range to view older saved snapshots." : "As you use CareerForge, saved readiness snapshots will appear here."}</p></div> : <>
          <div className="h-64 w-full sm:h-80" role="img" aria-label={`${visibleHistory.length} saved readiness snapshots. ${visibleHistory.map((item) => `${new Date(item.date).toLocaleDateString()}: ${item.readiness} percent`).join("; ")}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={visibleHistory} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="#263449" /><XAxis dataKey="date" tickFormatter={(value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })} stroke="#94a3b8" minTickGap={24} /><YAxis domain={[0, 100]} unit="%" stroke="#94a3b8" width={48} /><Tooltip labelFormatter={(value) => new Date(String(value)).toLocaleDateString()} formatter={(value) => [`${value}%`, "Recorded readiness"]} contentStyle={{ background: "#101a2b", border: "1px solid #334155", borderRadius: 12 }} /><Line type="monotone" dataKey="readiness" name="Recorded readiness" stroke="#00d9f5" strokeWidth={3} dot={{ r: 4, fill: "#00d9f5" }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
          <details className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-200">View chart data as a table</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Saved readiness snapshots in selected range</caption><thead><tr className="text-slate-400"><th className="py-2">Date</th><th className="py-2">Recorded readiness</th></tr></thead><tbody>{visibleHistory.map((item) => <tr key={item.date} className="border-t border-white/10"><td className="py-2">{new Date(item.date).toLocaleDateString()}</td><td className="py-2">{item.readiness}%</td></tr>)}</tbody></table></div></details>
        </>}
      </Panel>

      <Panel className="mb-6 rounded-2xl p-5 sm:p-6"><div className="mb-5"><p className="font-mono text-xs tracking-widest text-cyan-200">CURRENT EVIDENCE</p><h2 className="mt-2 text-xl font-black text-white">Readiness by component</h2><p className="mt-2 text-sm text-slate-400">Scores use the existing readiness calculator and its recorded inputs. Unavailable components remain unscored until evidence is available.</p></div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metricKeys.map((key) => { const metric = payload.readiness.metrics[key]; return <li key={key} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">{labels[key]}</h3><span className="font-mono text-sm font-bold text-cyan-200">{metric.available ? `${metric.score}%` : "Not measured"}</span></div><p className="mt-2 text-sm leading-relaxed text-slate-400">{metric.explanation}</p>{metric.available && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-label={`${labels[key]} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metric.score}><div className="h-full rounded-full bg-cyan-400" style={{ width: `${metric.score}%` }} /></div>}</li>; })}</ul>
        <p className="mt-4 text-xs text-slate-500">Calculated {new Date(payload.readiness.computedAt).toLocaleString()}.</p>
      </Panel>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel className="rounded-2xl p-5 sm:p-6"><h2 className="text-xl font-black text-white">Completed activities</h2><p className="mt-1 text-sm text-slate-400">Persisted totals for your profile.</p><dl className="mt-4 grid grid-cols-2 gap-3">{completedMetrics.map(({ key, label }) => <div key={key} className="rounded-lg border border-white/10 p-3"><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 text-xl font-bold text-white">{payload.completedCounts[key]}</dd></div>)}</dl></Panel>
        <Panel className="rounded-2xl p-5 sm:p-6"><h2 className="text-xl font-black text-white">Recent preparation activity</h2><p className="mt-1 text-sm text-slate-400">Latest 10 recorded events from the last 30 days.</p>{payload.recentActivity.length ? <ul className="mt-4 space-y-3">{payload.recentActivity.map((item, index) => <li key={`${item.category}-${item.timestamp}-${index}`} className="flex items-start justify-between gap-3 border-b border-white/10 pb-3"><div><p className="font-semibold text-white">{item.title}</p><p className="text-xs text-slate-400">{item.type}</p></div><time className="shrink-0 text-xs text-slate-400" dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleDateString()}</time></li>)}</ul> : <div className="mt-4 rounded-xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-400">No recent activity. Complete a preparation task to see it here.</div>}</Panel>
      </div>
    </> : <Panel className="rounded-2xl p-6"><p className="text-slate-300">No analytics data is available yet.</p></Panel>}
  </>;
}