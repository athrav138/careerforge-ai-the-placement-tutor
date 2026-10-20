"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ExternalLink, RefreshCw, Save } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";

type Application = {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  interviewDate: string | null;
  interviewNotes: string | null;
  followUpDate: string | null;
  job: { title: string; company: string; applicationUrl: string };
};

const statuses = ["DISCOVERED", "SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
const activeStatuses = new Set(["DISCOVERED", "SAVED", "APPLIED", "INTERVIEW"]);

export default function PlacementTrackingPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/applications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load your applications.");
      setApplications(data.applications ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load your applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    void load();
  }, [load]);

  useEffect(() => {
    let active = true;
    fetch("/api/applications", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load your applications.");
        return data;
      })
      .then((data) => {
        if (active) setApplications(data.applications ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Unable to load your applications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => Object.fromEntries(statuses.map((status) => [
    status,
    applications.filter((application) => application.status === status).length,
  ])) as Record<(typeof statuses)[number], number>, [applications]);

  const upcomingInterviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return applications
      .filter((application) => application.interviewDate && new Date(application.interviewDate) >= today)
      .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());
  }, [applications]);

  const updateStatus = async (application: Application, status: string) => {
    setBusyId(application.id);
    setError("");
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to update application status.");
      setApplications((current) => current.map((item) => item.id === application.id ? data.application : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update application status.");
    } finally {
      setBusyId(null);
    }
  };

  const updateDraft = (id: string, field: "notes" | "interviewNotes" | "interviewDate" | "followUpDate", value: string) => {
    setApplications((current) => current.map((item) => item.id === id ? { ...item, [field]: value || null } : item));
  };

  const saveDetails = async (application: Application) => {
    setBusyId(application.id);
    setError("");
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: application.status,
          notes: application.notes,
          interviewDate: application.interviewDate,
          interviewNotes: application.interviewNotes,
          followUpDate: application.followUpDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save application details.");
      setApplications((current) => current.map((item) => item.id === application.id ? data.application : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save application details.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <DashboardHeader title="Placement tracking" subtitle="Follow the applications and interview dates you have recorded." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Counts and dates come from your saved applications. Status history is not stored, so this page shows each current status.</p>
        <div className="flex gap-4">
          <Link href="/dashboard/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:underline">Job matching <ArrowRight size={15} /></Link>
          <button type="button" onClick={() => refresh()} disabled={loading} className="inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:underline disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>
      {error && <div className="mb-5 flex items-center gap-3 text-sm text-rose-600" role="alert"><span>{error}</span><button type="button" onClick={() => refresh()} className="font-semibold underline">Retry</button></div>}

      {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading placement data">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div> : <>
        <section aria-label="Application overview" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Panel className="rounded-2xl p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Total tracked</div><div className="mt-2 text-3xl font-bold text-ink">{applications.length}</div></Panel>
          <Panel className="rounded-2xl p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Active applications</div><div className="mt-2 text-3xl font-bold text-ink">{applications.filter((application) => activeStatuses.has(application.status)).length}</div></Panel>
          <Panel className="rounded-2xl p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Upcoming interviews</div><div className="mt-2 text-3xl font-bold text-ink">{upcomingInterviews.length}</div></Panel>
          <Panel className="rounded-2xl p-4"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Offers recorded</div><div className="mt-2 text-3xl font-bold text-ink">{counts.OFFER}</div></Panel>
        </section>

        <Panel className="mb-6 rounded-2xl p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-ink">Applications by current status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {statuses.map((status) => <div key={status} className="rounded-xl border border-line p-3"><div className="text-xs font-semibold text-muted">{status}</div><div className="mt-1 text-xl font-bold text-ink">{counts[status]}</div></div>)}
          </div>
        </Panel>

        <Panel className="mb-6 rounded-2xl p-5 sm:p-6"><h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><CalendarDays size={18} className="text-cyan" /> Upcoming interviews</h2>{upcomingInterviews.length > 0 ? <ul className="grid gap-2 sm:grid-cols-2">{upcomingInterviews.map((application) => <li key={application.id} className="rounded-xl border border-line p-3"><div className="font-semibold text-ink">{application.job.title}</div><div className="text-sm text-muted">{application.job.company} · {new Date(application.interviewDate!).toLocaleString()}</div></li>)}</ul> : <p className="text-sm text-muted">No future interview dates are recorded. Add one to an application when it is scheduled.</p>}</Panel>

        {applications.length === 0 ? <Panel className="rounded-2xl p-8 text-center"><BriefcaseBusiness size={28} className="mx-auto text-cyan" /><h2 className="mt-3 font-bold text-ink">No applications tracked yet</h2><p className="mt-2 text-sm text-muted">Save a matched opportunity or mark one as applied to start tracking it.</p><Link href="/dashboard/jobs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:underline">Explore job matches <ArrowRight size={15} /></Link></Panel> : <section aria-label="Tracked applications" className="grid gap-4 lg:grid-cols-2">
          {applications.map((application) => <Panel key={application.id} className="rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-ink">{application.job.title}</h2><p className="text-sm text-muted">{application.job.company}</p></div><label className="sr-only" htmlFor={`tracking-status-${application.id}`}>Application status for {application.job.title}</label><select id={`tracking-status-${application.id}`} value={application.status} disabled={busyId === application.id} onChange={(event) => void updateStatus(application, event.target.value)} className="rounded-lg border border-line bg-white px-2 py-2 text-xs font-semibold text-ink">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted">Applied</dt><dd className="mt-1 font-medium text-ink">{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Not recorded"}</dd></div><div><dt className="text-muted">Last updated</dt><dd className="mt-1 font-medium text-ink">{new Date(application.updatedAt).toLocaleDateString()}</dd></div></dl>
            <a href={application.job.applicationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan hover:underline">View job posting <ExternalLink size={14} /></a>
            <details className="mt-4 border-t border-line pt-3"><summary className="cursor-pointer text-sm font-semibold text-cyan">Notes, interview & follow-up details</summary><div className="mt-3 grid gap-3"><label className="grid gap-1 text-xs font-semibold text-muted">Application notes<textarea maxLength={2000} rows={2} value={application.notes ?? ""} onChange={(event) => updateDraft(application.id, "notes", event.target.value)} className="rounded-lg border border-line p-2 text-sm font-normal text-ink" /></label><label className="grid gap-1 text-xs font-semibold text-muted">Interview date<input type="date" value={application.interviewDate?.slice(0, 10) ?? ""} onChange={(event) => updateDraft(application.id, "interviewDate", event.target.value)} className="rounded-lg border border-line p-2 text-sm font-normal text-ink" /></label><label className="grid gap-1 text-xs font-semibold text-muted">Interview notes<textarea maxLength={2000} rows={2} value={application.interviewNotes ?? ""} onChange={(event) => updateDraft(application.id, "interviewNotes", event.target.value)} className="rounded-lg border border-line p-2 text-sm font-normal text-ink" /></label><label className="grid gap-1 text-xs font-semibold text-muted">Follow-up date<input type="date" value={application.followUpDate?.slice(0, 10) ?? ""} onChange={(event) => updateDraft(application.id, "followUpDate", event.target.value)} className="rounded-lg border border-line p-2 text-sm font-normal text-ink" /></label><Button type="button" icon={false} variant="secondary" disabled={busyId === application.id} onClick={() => void saveDetails(application)}><Save size={15} /> Save details</Button></div></details>
          </Panel>)}
        </section>}
      </>}
    </>
  );
}
