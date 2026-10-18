"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ResumeAnalyzerPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [activeResume, setActiveResume] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchResumeDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/resume/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveResume(data.resume);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
        if (data.resumes?.length > 0 && !activeResume) {
          fetchResumeDetails(data.resumes[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeResume, fetchResumeDetails]);

  useEffect(() => {
    const controller = new AbortController();
    const loadInitialResumes = async () => {
      try {
        const response = await fetch("/api/resume", { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (controller.signal.aborted) return;
        const items = data.resumes || [];
        setResumes(items);
        if (items.length) {
          const detailsResponse = await fetch(`/api/resume/${items[0].id}`, { signal: controller.signal });
          if (detailsResponse.ok) {
            const details = await detailsResponse.json();
            if (!controller.signal.aborted) setActiveResume(details.resume);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) console.error(error);
      }
    };
    void loadInitialResumes();
    return () => controller.abort();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      await fetchResumes();
      fetchResumeDetails(data.resumeId);
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeResume = async () => {
    if (!activeResume) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/resume/${activeResume.id}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchResumeDetails(activeResume.id);
        await fetchResumes(); // refresh list
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteResume = async (id: string) => {
    try {
      const res = await fetch(`/api/resume/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveResume(null);
        fetchResumes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <DashboardHeader title="Resume Analyzer" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <Panel title="Upload Resume">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition">
                <Upload className="h-8 w-8 text-neutral-400 mb-4" />
                <p className="text-sm text-neutral-600 text-center mb-4">
                  Drag & Drop Resume<br />
                  <span className="text-xs">Supported: PDF / DOCX</span>
                </p>
                <label className="cursor-pointer bg-neutral-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition">
                  {isUploading ? "Uploading..." : "Select File"}
                  <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading} />
                </label>
                {uploadError && <p className="text-xs text-red-500 mt-3 text-center">{uploadError}</p>}
              </div>
            </Panel>

            <Panel title="Your Resumes">
              {resumes.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4 text-center">No resumes uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {resumes.map(r => (
                    <div key={r.id} 
                         className={`p-3 rounded-md border flex items-center justify-between cursor-pointer ${activeResume?.id === r.id ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-200 hover:bg-neutral-50'}`}
                         onClick={() => fetchResumeDetails(r.id)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 text-neutral-500 shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{r.fileName}</p>
                          <p className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!activeResume ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center flex flex-col items-center">
                <FileText className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900">Upload your resume to begin analysis</h3>
                <p className="text-sm text-neutral-500 mt-2">Get career-specific feedback and improve your ATS score.</p>
              </div>
            ) : (
              <>
                <Panel>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold">{activeResume.fileName}</h2>
                      <p className="text-sm text-neutral-500">
                        Target Career: {activeResume.targetCareer?.title || "Not selected in profile"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => deleteResume(activeResume.id)} className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-md">Delete</button>
                      <button 
                        onClick={analyzeResume}
                        disabled={isAnalyzing || !activeResume.targetCareer}
                        className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        Analyze Resume
                      </button>
                    </div>
                  </div>
                  {!activeResume.targetCareer && (
                     <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md text-sm flex gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>Select a target career in your profile before analyzing your resume.</p>
                     </div>
                  )}
                </Panel>

                {activeResume.analysis && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Panel title="CareerForge Resume Score">
                        <div className="flex flex-col items-center justify-center p-6">
                          <div className="text-5xl font-bold text-neutral-900 mb-2">
                            {activeResume.analysis.atsScore} <span className="text-xl text-neutral-400 font-normal">/ 100</span>
                          </div>
                          <p className="text-sm text-neutral-500 text-center mt-2">
                            Career Match: {activeResume.analysis.atsScore}%
                          </p>
                        </div>
                      </Panel>

                      <Panel title="Resume Sections">
                        <div className="flex flex-col items-center justify-center p-6">
                          <div className="text-5xl font-bold text-neutral-900 mb-2">
                            {activeResume.analysis.sectionScore} <span className="text-xl text-neutral-400 font-normal">/ 100</span>
                          </div>
                          <p className="text-sm text-neutral-500 text-center mt-2">
                            Section completeness
                          </p>
                        </div>
                      </Panel>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Panel title="Career Skills Analysis">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-neutral-700 mb-2">Matched Skills</h4>
                            {activeResume.analysis.matchedSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {activeResume.analysis.matchedSkills.map((s: string) => (
                                  <span key={s} className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs">
                                    <CheckCircle2 className="h-3 w-3" /> {s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">None found.</p>
                            )}
                          </div>
                          <hr className="border-neutral-100" />
                          <div>
                            <h4 className="text-sm font-medium text-neutral-700 mb-2">Missing Skills</h4>
                            {activeResume.analysis.missingSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {activeResume.analysis.missingSkills.map((s: string) => (
                                  <span key={s} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-xs">
                                    <AlertCircle className="h-3 w-3" /> {s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">All required skills found!</p>
                            )}
                            
                            {activeResume.analysis.missingSkills.length > 0 && (
                              <div className="mt-4">
                                <button 
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/roadmap/update-from-resume", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ missingSkills: activeResume.analysis.missingSkills })
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        alert(`Successfully added ${data.addedCount} missing skills to your roadmap!`);
                                      } else {
                                        alert("Failed to update roadmap.");
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                                >
                                  <PlusCircle className="h-3 w-3" /> Add missing skills to Roadmap
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Panel>

                      <Panel title="Improvement Recommendations">
                        {activeResume.analysis.recommendations.length > 0 ? (
                          <ul className="space-y-3">
                            {activeResume.analysis.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="flex gap-3 text-sm text-neutral-700">
                                <span className="text-neutral-400 font-medium">{i + 1}.</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-neutral-500">Your resume looks great! No specific recommendations at this time.</p>
                        )}
                      </Panel>
                    </div>

                    <Panel title="All Detected Keywords">
                      <div className="flex flex-wrap gap-2">
                        {activeResume.analysis.detectedSkills.map((s: string) => (
                          <span key={s} className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-2 py-1 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </Panel>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
