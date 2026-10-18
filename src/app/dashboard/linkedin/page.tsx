"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { Briefcase, GraduationCap, Award, ExternalLink, RefreshCw, X, CheckCircle2, AlertCircle, Building, Calendar, Code2 } from "lucide-react";

type LinkedInProfile = {
  profile: {
    id: string;
    profileUrl: string;
    name: string;
    headline: string;
    about: string;
    location: string;
    lastSyncedAt: string;
    importedAt: string;
  };
  summary: {
    totalSkills: number;
    totalExperience: number;
    totalEducation: number;
    currentRoles: number;
    endorsedSkills: number;
  };
  skills: Array<{
    id: string;
    proficiency: string | null;
    endorsements: number;
    skill: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  experience: Array<{
    id: string;
    company: string;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
};

type LinkedInAnalytics = {
  overallScore: number;
  analytics: {
    profileCompleteness: { score: number; details: any };
    skills: { score: number; details: any; totalSkills: number };
    experience: { score: number; details: any };
    education: { score: number; details: any };
    careerAlignment: { score: number; details: any };
    evidenceCoverage: { score: number; details: any };
  };
  lastAnalyzedAt: string;
};

type ImportFormData = {
  profileUrl: string;
  name: string;
  headline: string;
  about: string;
  location: string;
  skills: Array<{ name: string; proficiency?: string; endorsements?: number }>;
  experience: Array<{
    company: string;
    title: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export default function LinkedInDashboard() {
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [analytics, setAnalytics] = useState<LinkedInAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ImportFormData>({
    profileUrl: "",
    name: "",
    headline: "",
    about: "",
    location: "",
    skills: [],
    experience: [],
    education: [],
  });

  const loadLinkedInData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [profileRes, analyticsRes] = await Promise.all([
        fetch("/api/linkedin/profile"),
        fetch("/api/linkedin/analytics"),
      ]);

      if (profileRes.status === 404) {
        setProfile(null);
        setAnalytics(null);
        setLoading(false);
        return;
      }

      if (!profileRes.ok || !analyticsRes.ok) {
        throw new Error("Failed to load LinkedIn data");
      }

      const [profileData, analyticsData] = await Promise.all([
        profileRes.json(),
        analyticsRes.json(),
      ]);

      setProfile(profileData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load LinkedIn data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      try {
        const [profileResponse, analyticsResponse] = await Promise.all([
          fetch("/api/linkedin/profile"),
          fetch("/api/linkedin/analytics"),
        ]);
        if (cancelled) return;
        if (profileResponse.status === 404) {
          setProfile(null);
          setAnalytics(null);
          return;
        }
        if (!profileResponse.ok || !analyticsResponse.ok) throw new Error("Failed to load LinkedIn data");
        const [profileData, analyticsData] = await Promise.all([profileResponse.json(), analyticsResponse.json()]);
        if (!cancelled) {
          setProfile(profileData);
          setAnalytics(analyticsData);
        }
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Failed to load LinkedIn data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadInitialData();
    return () => { cancelled = true; };
  }, []);

  const handleImport = async () => {
    if (!formData.profileUrl) {
      setError("Profile URL is required");
      return;
    }

    try {
      setImporting(true);
      setError(null);

      const response = await fetch("/api/linkedin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import LinkedIn profile");
      }

      setShowImportModal(false);
      resetFormData();
      await loadLinkedInData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import LinkedIn profile");
    } finally {
      setImporting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      profileUrl: "",
      name: "",
      headline: "",
      about: "",
      location: "",
      skills: [],
      experience: [],
      education: [],
    });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: "", proficiency: "INTERMEDIATE", endorsements: 0 }],
    });
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const updateSkill = (index: number, field: string, value: any) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setFormData({ ...formData, skills: updatedSkills });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { company: "", title: "", isCurrent: false }],
    });
  };

  const removeExperience = (index: number) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((_, i) => i !== index),
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setFormData({ ...formData, experience: updatedExperience });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { institution: "" }],
    });
  };

  const removeEducation = (index: number) => {
    setFormData({
      ...formData,
      education: formData.education.filter((_, i) => i !== index),
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setFormData({ ...formData, education: updatedEducation });
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to remove your LinkedIn profile data?")) return;

    try {
      const response = await fetch("/api/linkedin/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Failed to disconnect");
      setProfile(null);
      setAnalytics(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handleRefreshAnalytics = async () => {
    await loadLinkedInData();
  };

  if (loading) {
    return (
      <>
        <DashboardHeader title="LinkedIn Integration" subtitle="Import your LinkedIn profile to analyze your professional presence." />
        <Panel className="rounded-2xl p-6">
          <p className="text-muted">Loading LinkedIn data...</p>
        </Panel>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <DashboardHeader title="LinkedIn Integration" subtitle="Import your LinkedIn profile to analyze your professional presence." />
        <Panel className="rounded-2xl p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Briefcase className="text-muted" size={48} />
            <div>
              <h2 className="text-xl font-black text-ink">Import LinkedIn Profile</h2>
              <p className="mt-2 text-sm text-muted">
                Import your LinkedIn profile to analyze your skills, experience, and education for career alignment.
              </p>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="rounded-full bg-cyan px-6 py-2 text-sm font-semibold text-white hover:bg-cyan/90"
            >
              Import Profile
            </button>
          </div>
        </Panel>

        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
            <Panel className="w-full max-w-2xl rounded-2xl p-6 my-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-ink">Import LinkedIn Profile</h3>
                <button onClick={() => { setShowImportModal(false); resetFormData(); }} className="text-muted hover:text-ink">
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Profile URL *</label>
                  <input
                    type="url"
                    value={formData.profileUrl}
                    onChange={(e) => setFormData({ ...formData, profileUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-ink">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-ink">Headline</label>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="Professional headline"
                      className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink">About</label>
                  <textarea
                    value={formData.about}
                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                    placeholder="Professional summary"
                    rows={3}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-ink">Skills</label>
                    <button onClick={addSkill} className="text-xs font-semibold text-cyan hover:underline">
                      + Add Skill
                    </button>
                  </div>
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="mb-2 flex gap-2">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, "name", e.target.value)}
                        placeholder="Skill name"
                        className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <select
                        value={skill.proficiency}
                        onChange={(e) => updateSkill(index, "proficiency", e.target.value)}
                        className="rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                      <input
                        type="number"
                        value={skill.endorsements}
                        onChange={(e) => updateSkill(index, "endorsements", parseInt(e.target.value) || 0)}
                        placeholder="Endorsements"
                        className="w-20 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <button onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-ink">Experience</label>
                    <button onClick={addExperience} className="text-xs font-semibold text-cyan hover:underline">
                      + Add Experience
                    </button>
                  </div>
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="mb-3 rounded-lg border border-line bg-slate-50 p-3">
                      <div className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                          placeholder="Company"
                          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                          placeholder="Title"
                          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                        />
                        <button onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(index, "location", e.target.value)}
                          placeholder="Location"
                          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                        />
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) => updateExperience(index, "isCurrent", e.target.checked)}
                            className="rounded"
                          />
                          Current
                        </label>
                      </div>
                      <div className="mb-2 flex gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-muted">Start Date</label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                          />
                        </div>
                        {!exp.isCurrent && (
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-muted">End Date</label>
                            <input
                              type="date"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                            />
                          </div>
                        )}
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, "description", e.target.value)}
                        placeholder="Description"
                        rows={2}
                        className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-ink">Education</label>
                    <button onClick={addEducation} className="text-xs font-semibold text-cyan hover:underline">
                      + Add Education
                    </button>
                  </div>
                  {formData.education.map((edu, index) => (
                    <div key={index} className="mb-2 flex gap-2">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        placeholder="Institution"
                        className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        placeholder="Degree"
                        className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, "field", e.target.value)}
                        placeholder="Field"
                        className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <button onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full rounded-full bg-cyan px-6 py-2 text-sm font-semibold text-white hover:bg-cyan/90 disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Import Profile"}
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
        title="LinkedIn Integration" 
        subtitle={`Analyzing ${profile.profile.name || "your"}'s professional profile.`}
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
          <Briefcase className="text-cyan" size={20} />
          <span className="text-sm font-semibold text-ink">{profile.profile.name || "LinkedIn Profile"}</span>
          <span className="text-xs text-muted">
            Last synced: {new Date(profile.profile.lastSyncedAt).toLocaleDateString()}
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
            Remove
          </button>
        </div>
      </div>

      {analytics && (
        <Panel className="mb-4 rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">OVERALL LINKEDIN SCORE</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-ink">{analytics.overallScore}</span>
              <span className="text-sm text-muted">/ 100</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ScoreCard title="Profile Completeness" score={analytics.analytics.profileCompleteness.score} />
            <ScoreCard title="Skills" score={analytics.analytics.skills.score} />
            <ScoreCard title="Experience" score={analytics.analytics.experience.score} />
            <ScoreCard title="Education" score={analytics.analytics.education.score} />
            <ScoreCard title="Career Alignment" score={analytics.analytics.careerAlignment.score} />
            <ScoreCard title="Evidence Coverage" score={analytics.analytics.evidenceCoverage.score} />
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">PROFILE SUMMARY</div>
            <h2 className="mt-2 text-lg font-black text-ink">Professional Presence</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Total Skills" value={profile.summary.totalSkills} icon={<Award size={18} />} />
            <MetricCard label="Experience Roles" value={profile.summary.totalExperience} icon={<Briefcase size={18} />} />
            <MetricCard label="Education" value={profile.summary.totalEducation} icon={<GraduationCap size={18} />} />
            <MetricCard label="Current Roles" value={profile.summary.currentRoles} icon={<Building size={18} />} />
            <MetricCard label="Endorsed Skills" value={profile.summary.endorsedSkills} icon={<CheckCircle2 size={18} />} />
          </div>
          {profile.profile.headline && (
            <div className="mt-4 rounded-lg border border-line bg-slate-50 p-3">
              <div className="text-xs text-muted">Headline</div>
              <p className="mt-1 text-sm font-semibold text-ink">{profile.profile.headline}</p>
            </div>
          )}
        </Panel>

        <Panel className="rounded-2xl p-6">
          <div className="mb-4">
            <div className="text-xs tracking-widest text-muted font-mono">SKILLS</div>
            <h2 className="mt-2 text-lg font-black text-ink">Professional Skills</h2>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {profile.skills.slice(0, 10).map((skill) => (
              <div key={skill.id} className="flex items-center justify-between rounded-lg border border-line bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold capitalize text-ink">{skill.skill.name}</span>
                  {skill.proficiency && (
                    <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-xs font-semibold text-cyan">
                      {skill.proficiency}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {skill.endorsements > 0 && (
                    <span className="text-xs text-muted">{skill.endorsements} endorsements</span>
                  )}
                </div>
              </div>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-sm text-muted">No skills added yet.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4 rounded-2xl p-6">
        <div className="mb-4">
          <div className="text-xs tracking-widest text-muted font-mono">EXPERIENCE</div>
          <h2 className="mt-2 text-lg font-black text-ink">Work History</h2>
        </div>
        <div className="space-y-3">
          {profile.experience.map((exp) => (
            <div key={exp.id} className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{exp.title}</span>
                    {exp.isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <Building size={14} />
                    <span>{exp.company}</span>
                  </div>
                  {exp.location && (
                    <div className="mt-1 text-sm text-muted">{exp.location}</div>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Calendar size={12} />
                    <span>
                      {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : "Present"} - {" "}
                      {exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-sm text-muted">{exp.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-sm text-muted">No experience added yet.</p>
          )}
        </div>
      </Panel>

      <Panel className="mt-4 rounded-2xl p-6">
        <div className="mb-4">
          <div className="text-xs tracking-widest text-muted font-mono">EDUCATION</div>
          <h2 className="mt-2 text-lg font-black text-ink">Academic Background</h2>
        </div>
        <div className="space-y-3">
          {profile.education.map((edu) => (
            <div key={edu.id} className="rounded-lg border border-line bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-ink">{edu.institution}</div>
                  {edu.degree && (
                    <div className="mt-1 text-sm text-muted">{edu.degree}</div>
                  )}
                  {edu.field && (
                    <div className="text-sm text-muted">{edu.field}</div>
                  )}
                  {(edu.startDate || edu.endDate) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <Calendar size={12} />
                      <span>
                        {edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ""} - {" "}
                        {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : "Present"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {profile.education.length === 0 && (
            <p className="text-sm text-muted">No education added yet.</p>
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
