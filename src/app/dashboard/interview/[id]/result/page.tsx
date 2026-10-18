"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import ScoreBar from "@/components/ui/score-bar";

export default function InterviewResult() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/interview/sessions/${id}/result`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.result) {
          setResult(data.result);
        } else {
          router.replace("/dashboard/interview");
        }
      })
      .catch(() => router.replace("/dashboard/interview"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading || !result) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-cyan" size={32} />
      </div>
    );
  }

  const scoreColor = result.score >= 80 ? "text-green-500" : result.score >= 60 ? "text-amber-500" : "text-red-500";

  return (
    <>
      <DashboardHeader 
        title="Interview Results" 
        subtitle={`Completed on ${new Date(result.completedAt).toLocaleDateString()}`}
      />

      <div className="grid md:grid-cols-[1fr_2fr] gap-6 mb-8">
        <Panel className="p-6 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-xs font-mono text-muted tracking-widest mb-4">OVERALL SCORE</div>
          <div className={`text-6xl font-black ${scoreColor} mb-2`}>
            {result.score?.toFixed(1)}%
          </div>
          <div className="text-sm text-muted">
            Target Role: <span className="font-semibold text-ink">{result.targetRole}</span>
          </div>
          <div className="text-sm text-muted mt-1">
            Difficulty: <span className="font-semibold text-ink">{result.difficulty}</span>
          </div>
        </Panel>

        <Panel className="p-6 rounded-2xl">
          <div className="text-xs font-mono text-muted tracking-widest mb-6">CATEGORY PERFORMANCE</div>
          <div className="grid sm:grid-cols-2 gap-6">
            <ScoreBar label="Technical" value={result.technicalScore || 0} accent="#2563EB" />
            <ScoreBar label="HR & Behavioral" value={result.hrScore || 0} accent="#4F46E5" />
            <ScoreBar label="Resume Based" value={result.resumeScore || 0} accent="#16A34A" />
            <ScoreBar label="Communication" value={result.communicationScore || 0} accent="#F59E0B" />
          </div>
        </Panel>
      </div>

      <Panel className="p-6 rounded-2xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <BrainCircuit className="text-cyan" size={24} />
          <h2 className="text-xl font-black text-ink">Detailed Evaluation</h2>
        </div>

        <div className="space-y-6">
          {result.answers.map((ans: any, idx: number) => {
            const ev = ans.evaluation;
            const qScore = ev ? ev.score.toFixed(0) : 0;
            return (
              <div key={ans.id} className="border border-line rounded-xl p-5 bg-slate-50/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="font-bold text-ink text-lg">Q{idx + 1}: {ans.questionText}</div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-line shrink-0 ml-4">
                    <span className="text-xs font-mono text-muted">SCORE</span>
                    <span className="font-bold text-cyan">{qScore}%</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-xs text-muted mb-1 font-semibold tracking-wide">YOUR ANSWER</div>
                  <div className="text-sm text-ink bg-white p-3 rounded-lg border border-line">
                    {ans.answerText || <span className="italic text-muted">No answer provided.</span>}
                  </div>
                </div>

                {ev && (
                  <div className="bg-white p-4 rounded-xl border border-line">
                    <div className="text-xs text-muted mb-2 font-semibold tracking-wide flex items-center gap-2">
                    AI FEEDBACK {ev.score >= 70 ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                    </div>
                    <p className="text-sm text-ink mb-4">{ev.feedback}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-muted font-bold">RELEVANCE</div>
                        <div className="font-mono font-bold text-ink">{ev.relevance}/10</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-muted font-bold">ACCURACY</div>
                        <div className="font-mono font-bold text-ink">{ev.technicalAccuracy}/10</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-muted font-bold">COMPLETE</div>
                        <div className="font-mono font-bold text-ink">{ev.completeness}/10</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-muted font-bold">CLARITY</div>
                        <div className="font-mono font-bold text-ink">{ev.clarity}/10</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <div className="text-[10px] text-muted font-bold">PROFESSIONAL</div>
                        <div className="font-mono font-bold text-ink">{ev.professionalism}/10</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Button variant="secondary" onClick={() => router.push("/dashboard/interview")}>
        <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
      </Button>
    </>
  );
}
