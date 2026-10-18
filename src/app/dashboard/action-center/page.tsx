"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Clock3, ExternalLink, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";

type Action = { id: string; title: string; description: string; category: string; priority: string; reason: string; actionUrl: string | null; estimatedMinutes: number | null; completed: boolean };
type Metric = { score: number; available: boolean; explanation: string };
type Center = { actions: Action[]; readiness: { overallScore: number; metrics: Record<string, Metric>; recommendations: { title: string; detail: string; href: string }[] } };

const priorityStyles: Record<string, string> = { HIGH: "border-red-200 bg-red-50 text-red-700", MEDIUM: "border-amber-200 bg-amber-50 text-amber-700", LOW: "border-slate-200 bg-slate-50 text-slate-600" };
const signalLabels: Record<string, string> = { resume: "Resume", skills: "Skills", interview: "Interview", github: "GitHub", linkedin: "LinkedIn", projects: "Projects" };

export default function ActionCenter() {
  const [data, setData] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async (generate = false) => {
    setError("");
    generate ? setBusy(true) : setLoading(true);
    try {
      const response = await fetch("/api/action-center", { method: generate ? "POST" : "GET", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to load the action center.");
      setData(generate ? { ...(data ?? {}), actions: payload.actions } as Center : payload);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load the action center."); }
    finally { setLoading(false); setBusy(false); }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/action-center", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load the action center.");
        if (!cancelled) setData(payload);
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
    <DashboardHeader title="Career Action Center" subtitle="Your current placement priorities, grounded in the work you have already done." />
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
