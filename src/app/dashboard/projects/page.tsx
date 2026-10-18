"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";
import { CheckCircle2, Clock3, Lightbulb, RefreshCw, Star } from "lucide-react";

type Recommendation = {
  id: string;
  relevanceScore: number;
  reason: string | null;
  status: "RECOMMENDED" | "IN_PROGRESS" | "COMPLETED";
  skillsDemonstrated: string[];
  project: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    technologies: string[];
    estimatedDuration: number | null;
    careerRole: { title: string } | null;
    skillRelations: { name: string }[];
  };
};

const statusLabel = { RECOMMENDED: "Recommended", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

export default function Projects() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRecommendations = async (refresh = false) => {
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await fetch(refresh ? "/api/projects/recommendations/refresh" : "/api/projects/recommendations", {
        method: refresh ? "POST" : "GET",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load project recommendations.");
      setRecommendations(data.recommendations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load project recommendations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects/recommendations", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load project recommendations.");
        if (!cancelled) setRecommendations(data.recommendations);
      })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load project recommendations."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (recommendationId: string, status: Recommendation["status"]) => {
    setUpdatingId(recommendationId);
    setError("");
    try {
      const response = await fetch(`/api/projects/recommendations/${recommendationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update project status.");
      setRecommendations((current) => current.map((item) => item.id === recommendationId ? data.recommendation : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update project status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <DashboardHeader title="Recommended projects" subtitle="Evidence-building projects ranked from your career, skills, aptitude, resume, and roadmap data." />
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Each score is a transparent match score, not an AI-generated label.</p>
        <Button onClick={() => void loadRecommendations(true)} disabled={refreshing} icon={false} variant="secondary"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</Button>
      </div>
      {error && <p className="mb-5 text-sm text-red-600" role="alert">{error}</p>}
      {loading ? <Panel className="rounded-xl p-6 text-sm text-muted">Loading your project recommendations.</Panel> : recommendations.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {recommendations.map((recommendation) => {
            const project = recommendation.project;
            const updating = updatingId === recommendation.id;
            return <Panel key={recommendation.id} className="rounded-xl p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan"><Lightbulb size={18} /></div><div><div className="text-xs font-mono tracking-widest text-muted">{project.difficulty} · {project.careerRole?.title ?? "Career project"}</div><h2 className="mt-1 font-bold text-ink">{project.title}</h2></div></div>
                <div className="shrink-0 text-right"><div className="text-xs font-mono text-muted">MATCH</div><div className="text-xl font-black text-cyan">{recommendation.relevanceScore}%</div></div>
              </div>
              <p className="text-sm leading-relaxed text-muted">{project.description}</p>
              <p className="mt-4 border-l-2 border-cyan pl-3 text-sm leading-relaxed text-ink">{recommendation.reason}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="text-xs font-semibold text-muted">TECHNOLOGIES</div><p className="mt-1 text-sm text-ink">{project.technologies.join(", ")}</p></div><div><div className="text-xs font-semibold text-muted">SKILLS ADDRESSED</div><p className="mt-1 text-sm capitalize text-ink">{project.skillRelations.map((skill) => skill.name).join(", ")}</p></div></div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><div className="flex items-center gap-2 text-xs font-semibold text-muted"><Clock3 size={14} /> {project.estimatedDuration ?? "Flexible"} {project.estimatedDuration ? "hours" : "duration"}<span className="ml-2 rounded-full border border-line px-2 py-1">{statusLabel[recommendation.status]}</span></div>
                {recommendation.status === "RECOMMENDED" && <Button icon={false} onClick={() => void updateStatus(recommendation.id, "IN_PROGRESS")} disabled={updating}>Start project</Button>}
                {recommendation.status === "IN_PROGRESS" && <Button icon={false} onClick={() => void updateStatus(recommendation.id, "COMPLETED")} disabled={updating}><CheckCircle2 size={15} /> Mark completed</Button>}
                {recommendation.status === "COMPLETED" && <div className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 size={16} /> Portfolio evidence saved</div>}
              </div>
            </Panel>;
          })}
        </div>
      ) : <Panel className="rounded-xl p-6"><Star className="mb-3 text-warning" size={20} /><h2 className="font-bold text-ink">No catalog matches yet</h2><p className="mt-2 text-sm text-muted">Choose a target career and run career analysis, then refresh project recommendations.</p></Panel>}
    </>
  );
}
