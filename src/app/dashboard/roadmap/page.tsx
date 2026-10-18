"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";
import { AlertCircle, BrainCircuit, CheckCircle2, Circle, Loader2, RefreshCw, Route } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskSource = "CAREER_GAP" | "APTITUDE_WEAK" | "RESUME_GAP";
type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  source: TaskSource;
  priority: TaskPriority;
};

type Roadmap = {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  careerRole: { title: string };
  tasks: Task[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_META: Record<TaskSource, { label: string; className: string }> = {
  APTITUDE_WEAK: {
    label: "Aptitude gap",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  CAREER_GAP: {
    label: "Career gap",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  RESUME_GAP: {
    label: "Resume gap",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-slate-300",
};

function SourceBadge({ source }: { source: TaskSource }) {
  // Handle tasks created before Phase 4.4 that may lack a valid source
  const meta = SOURCE_META[source] ?? SOURCE_META["CAREER_GAP"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/roadmap", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load roadmap.");
        if (!cancelled) setRoadmap(data.roadmap);
      })
      .catch((requestError: Error) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Group tasks by category, preserve priority ordering within each group
  const groupedTasks = useMemo(
    () =>
      roadmap?.tasks.reduce<Record<string, Task[]>>((groups, task) => {
        (groups[task.category] ??= []).push(task);
        return groups;
      }, {}) ?? {},
    [roadmap],
  );

  const generate = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/roadmap", { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Unable to generate roadmap.");
    else setRoadmap(data.roadmap);
    setBusy(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    setError("");
    const res = await fetch("/api/roadmap/refresh", { method: "POST" });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Unable to refresh roadmap.");
    else setRoadmap(data.roadmap);
    setRefreshing(false);
  };

  const updateTask = async (task: Task) => {
    const status = task.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    const res = await fetch(`/api/roadmap/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to update task.");
      return;
    }
    setRoadmap((current) =>
      current
        ? {
            ...current,
            progress: data.progress,
            status: data.status,
            tasks: current.tasks.map((t) => (t.id === task.id ? { ...t, status } : t)),
          }
        : current,
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <DashboardHeader
        title="Personalised learning roadmap"
        subtitle="A unified plan built from your career analysis, aptitude performance, and resume gaps."
      />

      {/* Hero panel */}
      <Panel className="rounded-2xl p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="text-xs tracking-widest text-muted font-mono mb-2">PERSONALISED PLAN</div>
            <h2 className="text-2xl font-black text-ink">
              {roadmap?.title ?? "Turn your skill gaps into a plan"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {roadmap?.description ??
                "Run a career analysis to generate a roadmap from your missing skills."}
            </p>
            {roadmap && (
              <p className="mt-2 text-sm font-semibold text-cyan">
                Target career: {roadmap.careerRole.title} · {roadmap.progress}% complete
              </p>
            )}

            {/* Source legend */}
            {roadmap && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-muted font-medium mr-1">Task sources:</span>
                {(["CAREER_GAP", "APTITUDE_WEAK", "RESUME_GAP"] as TaskSource[]).map((s) => (
                  <SourceBadge key={s} source={s} />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh button — only shown when a roadmap exists */}
            {roadmap && (
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                title="Pull in new gaps from your latest assessment and resume"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-cyan/40 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing…" : "Refresh from gaps"}
              </button>
            )}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
              <Route size={26} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {roadmap && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>Overall progress</span>
              <span className="font-mono font-bold">{roadmap.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-cyan transition-all duration-500"
                style={{ width: `${roadmap.progress}%` }}
              />
            </div>
          </div>
        )}
      </Panel>

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
        <Panel className="rounded-2xl p-8 text-center text-muted">
          <Loader2 className="mx-auto animate-spin" />
        </Panel>
      ) : roadmap ? (
        <div className="space-y-4">
          {/* Priority spotlight: critical tasks */}
          {(() => {
            const criticalTasks = roadmap.tasks.filter(
              (t) => t.priority === "CRITICAL" && t.status !== "COMPLETED",
            );
            if (criticalTasks.length === 0) return null;
            return (
              <Panel className="rounded-2xl p-6 border-red-200 bg-red-50/30">
                <div className="mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <h3 className="font-black text-red-700">Critical priorities</h3>
                  <span className="text-xs font-mono text-red-500">
                    {criticalTasks.length} task{criticalTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {criticalTasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={updateTask} />
                  ))}
                </div>
              </Panel>
            );
          })()}

          {/* Tasks grouped by category */}
          {Object.entries(groupedTasks).map(([category, tasks]) => (
            <Panel key={category} className="rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-black text-ink">{category}</h3>
                <span className="text-xs font-mono text-muted">
                  {tasks.filter((t) => t.status === "COMPLETED").length}/{tasks.length} complete
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={updateTask} />
                ))}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="rounded-2xl p-8 text-center">
          <BrainCircuit className="mx-auto mb-4 text-cyan" size={28} />
          <h3 className="font-bold text-ink">No personalised roadmap yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Complete your profile and run career analysis first. If you have already done aptitude
            assessments your weak skills will automatically be included.
          </p>
          <Button icon={false} className="mt-5" onClick={generate} disabled={busy}>
            {busy ? "Generating…" : "Generate my roadmap"}
          </Button>
        </Panel>
      )}
    </>
  );
}

// ─── Task row component ────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (task: Task) => void;
}) {
  const priorityDot = PRIORITY_DOT[task.priority] ?? PRIORITY_DOT["MEDIUM"];

  return (
    <button
      type="button"
      onClick={() => onToggle(task)}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-slate-50/70 p-4 text-left transition hover:border-cyan/40 hover:bg-white"
    >
      {task.status === "COMPLETED" ? (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" />
      ) : (
        <Circle size={19} className="mt-0.5 shrink-0 text-muted" />
      )}

      <span className="flex-1 min-w-0">
        <span
          className={`block text-sm font-semibold ${
            task.status === "COMPLETED" ? "text-muted line-through" : "text-ink"
          }`}
        >
          {/* Priority dot */}
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${priorityDot}`}
          />
          {task.title}
        </span>

        {task.description && (
          <span className="mt-1 block text-xs text-muted">{task.description}</span>
        )}

        {/* Source badge — only on non-completed tasks */}
        {task.status !== "COMPLETED" && (
          <span className="mt-2 block">
            <SourceBadge source={task.source ?? "CAREER_GAP"} />
          </span>
        )}
      </span>
    </button>
  );
}
