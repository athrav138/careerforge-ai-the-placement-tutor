"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ExternalLink, RefreshCw, Save, Send } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  description: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string | null;
  salaryRange: string | null;
  applicationUrl: string;
};
type Recommendation = Job & {
  matchScore: number;
  skillCoverage: number;
  missingSkills: string[];
  explanation: string;
};
type Application = { id: string; jobId: string; status: string; appliedAt: string | null; job: Job };

const statuses = ["DISCOVERED", "SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];

export default function Jobs() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async (refresh = false) => {
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        fetch("/api/jobs/recommended", { method: refresh ? "POST" : "GET", cache: "no-store" }),
        fetch("/api/applications", { cache: "no-store" }),
      ]);
      const jobsData = await jobsResponse.json();
      const applicationsData = await applicationsResponse.json();
      if (!jobsResponse.ok) throw new Error(jobsData.error ?? "Unable to load recommended jobs.");
      setRecommendations((jobsData.recommendations ?? []).map((item: { job: Job } & Omit<Recommendation, keyof Job>) => ({ ...item.job, ...item })));
      setApplications(applicationsData.applications ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load jobs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/jobs/recommended", { cache: "no-store" }),
      fetch("/api/applications", { cache: "no-store" }),
    ])
      .then(async ([jobsResponse, applicationsResponse]) => {
        const [jobsData, applicationsData] = await Promise.all([jobsResponse.json(), applicationsResponse.json()]);
        if (!jobsResponse.ok) throw new Error(jobsData.error ?? "Unable to load recommended jobs.");
        if (!cancelled) {
          setRecommendations((jobsData.recommendations ?? []).map((item: { job: Job } & Omit<Recommendation, keyof Job>) => ({ ...item.job, ...item })));
          setApplications(applicationsData.applications ?? []);
        }
      })
      .catch((requestError) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load jobs."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updateJob = async (jobId: string, action: "save" | "apply") => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Unable to ${action} job.`);
      setApplications((current) => {
        const next = current.filter((item) => item.jobId !== jobId);
        return [data.application, ...next];
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Unable to ${action} job.`);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const response = await fetch(`/api/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Unable to update application."); return; }
    setApplications((current) => current.map((item) => item.id === id ? data.application : item));
  };

  return (
    <>
      <DashboardHeader title="Job matching" subtitle="Find opportunities ranked against your career, skills, evidence, and readiness signals." />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Every match is deterministic and explainable. Missing skills connect directly to your preparation plan.</p>
        <Button variant="secondary" icon={false} disabled={refreshing} onClick={() => void load(true)}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh matches</Button>
      </div>
      {error && <p className="mb-5 text-sm text-rose-600" role="alert">{error}</p>}
      {applications.length > 0 && <Panel className="mb-6 rounded-2xl p-6"><div className="mb-4 text-xs tracking-widest text-muted font-mono">APPLICATION TRACKER</div><div className="grid gap-3 md:grid-cols-2">{applications.map((application) => <div key={application.id} className="rounded-xl border border-line p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-ink">{application.job.title}</div><div className="text-sm text-muted">{application.job.company}</div></div><select value={application.status} onChange={(event) => void updateStatus(application.id, event.target.value)} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-ink">{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>{application.appliedAt && <div className="mt-2 text-xs text-muted">Applied {new Date(application.appliedAt).toLocaleDateString()}</div>}</div>)}</div></Panel>}
      {loading ? <Panel className="rounded-2xl p-6 text-sm text-muted">Calculating your job matches...</Panel> : recommendations.length ? <div className="grid gap-5 lg:grid-cols-2">{recommendations.map((job) => {
        const application = applications.find((item) => item.jobId === job.id);
        return <Panel key={job.id} className="rounded-2xl p-5"><div className="mb-4 flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan"><BriefcaseBusiness size={18} /></div><div><div className="text-xs font-mono tracking-widest text-muted">{job.company} · {job.workMode ?? "Flexible"}</div><h2 className="mt-1 font-bold text-ink">{job.title}</h2></div></div><div className="text-right"><div className="text-xs font-mono text-muted">MATCH</div><div className="text-2xl font-black text-cyan">{job.matchScore}%</div></div></div><div className="mb-4 flex flex-wrap gap-2 text-xs text-muted"><span>{job.location ?? "Location flexible"}</span><span>·</span><span>{job.experienceLevel ?? "Any experience"}</span>{job.salaryRange && <><span>·</span><span>{job.salaryRange}</span></>}</div><p className="text-sm leading-relaxed text-muted">{job.description}</p><p className="mt-4 border-l-2 border-cyan pl-3 text-sm leading-relaxed text-ink">{job.explanation}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><div className="text-xs font-semibold text-muted">YOU HAVE</div><div className="mt-2 flex flex-wrap gap-1.5">{job.requiredSkills.filter((skill) => !job.missingSkills.includes(skill)).map((skill) => <span key={skill} className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">{skill}</span>)}</div></div><div><div className="text-xs font-semibold text-muted">YOU NEED</div><div className="mt-2 flex flex-wrap gap-1.5">{job.missingSkills.length ? job.missingSkills.map((skill) => <Link key={skill} href="/dashboard/skills" className="rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">{skill}</Link>) : <span className="text-xs text-success">All required skills covered</span>}</div></div></div><div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">{!application && <><Button icon={false} variant="secondary" onClick={() => void updateJob(job.id, "save")}><Save size={15} /> Save</Button><Button icon={false} onClick={() => void updateJob(job.id, "apply")}><Send size={15} /> Mark applied</Button></>}{application && <span className="rounded-full border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs font-semibold text-cyan">{application.status}</span>}<a href={job.applicationUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:underline">View posting <ExternalLink size={14} /></a></div></Panel>;
      })}</div> : <Panel className="rounded-2xl p-6"><h2 className="font-bold text-ink">No opportunities available</h2><p className="mt-2 text-sm text-muted">The job catalog is empty. Run the Phase 4.11 migration or add opportunities to the catalog.</p><Link href="/dashboard/profile" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan">Complete your profile <ArrowRight size={15} /></Link></Panel>}
    </>
  );
}
