"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, RefreshCw, Target } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import Panel from "@/components/ui/panel";
import { filterReadinessHistory, requestReadinessAnalytics, type AnalyticsPayload, type ReadinessMetricKey } from "@/lib/readiness-analytics";

const ReadinessHistoryChart = dynamic(() => import("@/components/dashboard/readiness-history-chart"), {
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-white/5 sm:h-80" aria-label="Loading readiness chart" aria-busy="true" />,
});

const labels: Record<ReadinessMetricKey, string> = { career: "Career alignment", skills: "Technical skills", resume: "Resume", aptitude: "Aptitude", interview: "Interview practice", learning: "Roadmap progress", projects: "Project evidence", github: "GitHub evidence", linkedin: "LinkedIn evidence" };
const keys = Object.keys(labels) as ReadinessMetricKey[];
type Range = "30" | "90" | "all";

export default function Analytics() {
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>("90");
  const refresh = useCallback(async () => {
    setLoading(true); setError(false);
    try { setPayload(await requestReadinessAnalytics()); } catch { setError(true); } finally { setLoading(false); }
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
    const entries = payload?.history ?? [];
    const anchor = payload ? Date.parse(payload.current.computedAt) : 0;
    return range === "all" ? entries : filterReadinessHistory(entries, anchor - Number(range) * 86400000);
  }, [payload, range]);
  const availableCount = payload ? keys.filter((key) => payload.current.metrics[key].available).length : 0;
  const weakSkillCountAvailable = payload?.current.weakSkillCountAvailable ?? false;

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
        <StatCard label="Measured areas" value={`${availableCount} / ${keys.length}`} detail="Areas with supporting evidence for the latest calculation." icon={Target} accent="cyan" />
        <StatCard label="Saved snapshots" value={String(payload.history.length)} detail="Readiness records stored for your profile." icon={Activity} accent="forge" />
        <StatCard label="Weak or critical skills" value={weakSkillCountAvailable ? String(payload.current.weakSkillCount) : "—"} detail={weakSkillCountAvailable ? "Assessed skills marked weak or critical." : "Complete a skill assessment to measure this."} icon={Activity} accent="warning" />
      </div>
      <Panel className="mb-6 rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs tracking-widest text-cyan-200">PERSISTED READINESS HISTORY</p><h2 className="mt-2 text-xl font-black text-white">Recorded readiness snapshots</h2><p className="mt-2 max-w-2xl text-sm text-slate-400">Each point is the weighted readiness score saved in your profile. The formula assigns zero to areas without evidence at that time, and older snapshots do not preserve component availability. Changes in evidence coverage can affect the score.</p></div>
          <label className="text-sm text-slate-300">Time range<select value={range} onChange={(event) => setRange(event.target.value as Range)} className="mt-1 block min-h-11 w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 text-white sm:w-44"><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All available</option></select></label>
        </div>
        {visibleHistory.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center"><p className="font-semibold text-white">No readiness history in this range</p><p className="mt-2 text-sm text-slate-400">{payload.history.length ? "Choose a wider time range to view older saved snapshots." : "As you use CareerForge, saved readiness snapshots will appear here."}</p></div> : <>
          <ReadinessHistoryChart history={visibleHistory} />
          <details className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-200">View chart data as a table</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Saved readiness snapshots in selected range</caption><thead><tr className="text-slate-400"><th className="py-2">Date</th><th className="py-2">Recorded readiness</th></tr></thead><tbody>{visibleHistory.map((item) => <tr key={item.date} className="border-t border-white/10"><td className="py-2">{new Date(item.date).toLocaleDateString()}</td><td className="py-2">{item.readiness}%</td></tr>)}</tbody></table></div></details>
        </>}
      </Panel>
      <Panel className="rounded-2xl p-5 sm:p-6"><div className="mb-5"><p className="font-mono text-xs tracking-widest text-cyan-200">CURRENT EVIDENCE</p><h2 className="mt-2 text-xl font-black text-white">Readiness by component</h2><p className="mt-2 text-sm text-slate-400">Scores use the existing readiness calculator and its explanations. Unavailable components stay unscored until there is supporting data.</p></div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{keys.map((key) => { const metric = payload.current.metrics[key]; return <li key={key} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">{labels[key]}</h3><span className="font-mono text-sm font-bold text-cyan-200">{metric.available ? `${metric.score}%` : "Not measured"}</span></div><p className="mt-2 text-sm leading-relaxed text-slate-400">{metric.explanation}</p>{metric.available && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-label={`${labels[key]} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metric.score}><div className="h-full rounded-full bg-cyan-400" style={{ width: `${metric.score}%` }} /></div>}</li>; })}</ul>
        <p className="mt-4 text-xs text-slate-500">Calculated {new Date(payload.current.computedAt).toLocaleString()}.</p>
      </Panel>
    </> : null}
  </>;
}
