"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { Star, GitFork, FileText, Lock, ExternalLink, RefreshCw, X, CheckCircle2, AlertCircle, Code2 } from "lucide-react";

type GitHubConnection = {
  id: string;
  username: string;
  lastSyncedAt: string;
  isActive: boolean;
  connectedAt: string;
};

type GitHubRepository = {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  topics: string[];
  hasReadme: boolean;
  hasLicense: boolean;
  createdAt: string;
  updatedAt: string;
};

type GitHubSkill = {
  id: string;
  skill: {
    id: string;
    name: string;
    category: string;
  };
  confidence: string;
  evidenceCount: number;
  repositoryIds: string[];
};

type GitHubAnalytics = {
  overallScore: number;
  analytics: {
    profileCompleteness: { score: number; details: any };
    repositoryActivity: { score: number; details: any };
    technicalSkills: { score: number; details: any; totalSkills: number };
    projectQuality: { score: number; details: any };
    consistency: { score: number };
    documentation: { score: number };
    collaboration: { score: number };
    technologyDiversity: { score: number; details: any };
    careerAlignment: { score: number };
  };
  lastAnalyzedAt: string;
};

type GitHubProfile = {
  connection: GitHubConnection;
  metrics: {
    totalRepositories: number;
    publicRepositories: number;
    totalStars: number;
    totalForks: number;
    repositoriesWithReadme: number;
    repositoriesWithLicense: number;
    uniqueLanguages: number;
    totalSkills: number;
    highConfidenceSkills: number;
  };
  repositories: GitHubRepository[];
  skills: GitHubSkill[];
};

export default function GitHubDashboard() {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [analytics, setAnalytics] = useState<GitHubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadGitHubData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileRes, analyticsRes] = await Promise.all([
        fetch("/api/github/profile"),
        fetch("/api/github/analytics"),
      ]);

      if (profileRes.status === 404) {
        setProfile(null);
        setAnalytics(null);
        setLoading(false);
        return;
      }

      if (!profileRes.ok || !analyticsRes.ok) {
        throw new Error("Failed to load GitHub data");
      }

      const [profileData, analyticsData] = await Promise.all([
        profileRes.json(),
        analyticsRes.json(),
      ]);

      setProfile(profileData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GitHub data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      try {
        const [profileResponse, analyticsResponse] = await Promise.all([
          fetch("/api/github/profile"),
          fetch("/api/github/analytics"),
        ]);
        if (cancelled) return;
        if (profileResponse.status === 404) {
          setProfile(null);
          setAnalytics(null);
          return;
        }
        if (!profileResponse.ok || !analyticsResponse.ok) throw new Error("Failed to load GitHub data");
        const [profileData, analyticsData] = await Promise.all([profileResponse.json(), analyticsResponse.json()]);
        if (!cancelled) {
          setProfile(profileData);
          setAnalytics(analyticsData);
        }
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Failed to load GitHub data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadInitialData();
    return () => { cancelled = true; };
  }, []);

  const handleSync = async () => {
    if (!accessToken || !username) {
      setError("Please provide both access token and username");
      return;
    }

    try {
      setSyncing(true);
      setError(null);

      const response = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync GitHub");
      }

      setShowSyncModal(false);
      setAccessToken("");
      setUsername("");
      await loadGitHubData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync GitHub");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your GitHub account?")) return;

    try {
      const response = await fetch("/api/github/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Failed to disconnect");
      setProfile(null);
      setAnalytics(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handleRefreshAnalytics = async () => {
    await loadGitHubData();
  };

  if (loading) {
    return (
      <>
        <DashboardHeader title="GitHub Integration" subtitle="Connect your GitHub account to analyze your technical portfolio." />
        <Panel className="rounded-2xl p-6">
          <p className="text-muted">Loading GitHub data...</p>
        </Panel>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <DashboardHeader title="GitHub Integration" subtitle="Connect your GitHub account to analyze your technical portfolio." />
        <Panel className="rounded-2xl p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Code2 className="text-muted" size={48} />
            <div>
              <h2 className="text-xl font-black text-ink">Connect GitHub</h2>
              <p className="mt-2 text-sm text-muted">
                Connect your GitHub account to analyze your repositories, detect technical skills, and measure your professional portfolio quality.
              </p>
            </div>
            <button
              onClick={() => setShowSyncModal(true)}
              className="rounded-full bg-cyan px-6 py-2 text-sm font-semibold text-white hover:bg-cyan/90"
            >
              Connect GitHub
            </button>
          </div>
        </Panel>

        {showSyncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Panel className="w-full max-w-md rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-ink">Connect GitHub</h3>
                <button onClick={() => setShowSyncModal(false)} className="text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">GitHub Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Personal Access Token</label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Create a token with <code className="bg-slate-100 px-1">public_repo</code> scope from GitHub Settings → Developer settings → Personal access tokens.
                  </p>
                </div>
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full rounded-full bg-cyan px-6 py-2 text-sm font-semibold text-white hover:bg-cyan/90 disabled:opacity-50"
                >
                  {syncing ? "Connecting..." : "Connect"}
                </button>
              </div>
            </Panel>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <DashboardHeader 
        title="GitHub Integration" 
        subtitle={`Analyzing @${profile.connection.username}'s technical portfolio.`}
      />
      
      {error && (
        <Panel className="mb-4 rounded-2xl border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </Panel>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="text-cyan" size={20} />
          <span className="text-sm font-semibold text-ink">@{profile.connection.username}</span>
          <span className="text-xs text-muted">
            Last synced: {new Date(profile.connection.lastSyncedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshAnalytics}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <X size={16} />
            Disconnect
          </button>
        </div>
      </div>

      {analytics && (
        <Panel className="mb-4 rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">OVERALL GITHUB SCORE</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-ink">{analytics.overallScore}</span>
              <span className="text-sm text-muted">/ 100</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard title="Profile Completeness" score={analytics.analytics.profileCompleteness.score} />
            <ScoreCard title="Repository Activity" score={analytics.analytics.repositoryActivity.score} />
            <ScoreCard title="Technical Skills" score={analytics.analytics.technicalSkills.score} />
            <ScoreCard title="Project Quality" score={analytics.analytics.projectQuality.score} />
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">PORTFOLIO METRICS</div>
            <h2 className="mt-2 text-lg font-black text-ink">Your GitHub Presence</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Total Repositories" value={profile.metrics.totalRepositories} icon={<Code2 size={18} />} />
            <MetricCard label="Public Repositories" value={profile.metrics.publicRepositories} icon={<Lock size={18} />} />
            <MetricCard label="Total Stars" value={profile.metrics.totalStars} icon={<Star size={18} />} />
            <MetricCard label="Total Forks" value={profile.metrics.totalForks} icon={<GitFork size={18} />} />
            <MetricCard label="With README" value={profile.metrics.repositoriesWithReadme} icon={<FileText size={18} />} />
            <MetricCard label="With License" value={profile.metrics.repositoriesWithLicense} icon={<CheckCircle2 size={18} />} />
            <MetricCard label="Unique Languages" value={profile.metrics.uniqueLanguages} icon={<Code2 size={18} />} />
            <MetricCard label="Detected Skills" value={profile.metrics.totalSkills} icon={<CheckCircle2 size={18} />} />
          </div>
        </Panel>

        <Panel className="rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">DETECTED SKILLS</div>
            <h2 className="mt-2 text-lg font-black text-ink">Technical Evidence</h2>
          </div>
          <div className="space-y-2">
            {profile.skills.slice(0, 8).map((skill) => (
              <div key={skill.id} className="flex items-center justify-between rounded-lg border border-line bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold capitalize text-ink">{skill.skill.name}</span>
                  <span className="text-xs text-muted">({skill.evidenceCount} repos)</span>
                </div>
                <span className={`text-xs font-semibold ${
                  skill.confidence === "HIGH" ? "text-success" : 
                  skill.confidence === "MEDIUM" ? "text-warning" : "text-muted"
                }`}>
                  {skill.confidence}
                </span>
              </div>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-muted">No skills detected yet. Sync your repositories to analyze technologies.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4 rounded-2xl p-6">
        <div className="mb-4">
          <div className="text-xs tracking-widest text-muted font-mono">REPOSITORIES</div>
          <h2 className="mt-2 text-lg font-black text-ink">Your Projects</h2>
        </div>
        <div className="space-y-3">
          {profile.repositories.slice(0, 6).map((repo) => (
            <div key={repo.id} className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-ink hover:text-cyan"
                    >
                      {repo.name}
                    </a>
                    <ExternalLink size={14} className="text-muted" />
                  </div>
                  {repo.description && (
                    <p className="mt-1 text-sm text-muted">{repo.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {repo.primaryLanguage && (
                      <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-xs font-semibold text-cyan">
                        {repo.primaryLanguage}
                      </span>
                    )}
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-ink">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 text-sm text-muted">
                  <div className="flex items-center gap-1">
                    <Star size={14} />
                    <span>{repo.stars}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork size={14} />
                    <span>{repo.forks}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {profile.repositories.length === 0 && (
            <p className="text-sm text-muted">No repositories found. Make sure your repositories are public and sync again.</p>
          )}
        </div>
      </Panel>
    </>
  );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  const getColor = () => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted";
  };

  return (
    <div>
      <div className="text-xs text-muted">{title}</div>
      <div className={`mt-1 text-2xl font-black ${getColor()}`}>{score}</div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-slate-50 px-3 py-2">
      <div className="text-cyan">{icon}</div>
      <div>
        <div className="text-lg font-black text-ink">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </div>
  );
}
