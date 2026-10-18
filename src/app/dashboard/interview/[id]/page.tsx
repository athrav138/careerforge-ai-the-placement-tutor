"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/header";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type Answer = {
  id: string;
  questionText: string;
  answerText: string | null;
  evaluation?: any;
};

type Session = {
  id: string;
  status: string;
  numQuestions: number;
  answers: Answer[];
};

export default function ActiveInterview() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/interview/sessions/${id}/result`)
      .then(res => res.json())
      .then(data => {
        // If it's completed, redirect to results
        if (data.result && data.result.status === "COMPLETED") {
          router.replace(`/dashboard/interview/${id}/result`);
        }
      })
      .catch(() => {})
      .finally(() => {
        // Fetch session answers (for active session, we might need a dedicated GET, 
        // but we can reuse the result endpoint if it allows IN_PROGRESS, wait, 
        // /result endpoint blocks IN_PROGRESS. We should fetch from a dedicated endpoint or 
        // just assume we have the session from a generic GET. 
        // Actually, let's just fetch from the general sessions list for now to get answers, 
        // OR we can make a small API call to get active session details.)
      });

      // Let's fetch the session details
      fetch("/api/interview/sessions")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const found = data.sessions.find((s: any) => s.id === id);
            if (found) {
              if (found.status === "COMPLETED") {
                router.replace(`/dashboard/interview/${id}/result`);
              } else {
                // We need the answers. Let's fetch them directly.
                fetch(`/api/interview/sessions/${id}/active`)
                  .then(r => r.json())
                  .then(activeData => {
                    if (activeData.success) {
                      setSession(activeData.session);
                      // find first unanswered
                      const firstUnanswered = activeData.session.answers.findIndex((a: any) => !a.answerText);
                      setCurrentIdx(Math.max(0, firstUnanswered));
                      setCurrentAnswer(activeData.session.answers[Math.max(0, firstUnanswered)]?.answerText || "");
                    }
                  });
              }
            }
          }
        })
        .finally(() => setLoading(false));
  }, [id, router]);

  const saveCurrentAnswer = async () => {
    if (!session || !currentAnswer.trim()) return true;
    const answerId = session.answers[currentIdx].id;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/interview/sessions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId, answerText: currentAnswer })
      });
      if (res.ok) {
        const updated = [...session.answers];
        updated[currentIdx].answerText = currentAnswer;
        setSession({ ...session, answers: updated });
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const success = await saveCurrentAnswer();
    if (success && currentIdx < (session?.numQuestions || 0) - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer(session!.answers[currentIdx + 1].answerText || "");
    }
  };

  const handlePrev = async () => {
    await saveCurrentAnswer();
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setCurrentAnswer(session!.answers[currentIdx - 1].answerText || "");
    }
  };

  const handleSubmit = async () => {
    const success = await saveCurrentAnswer();
    if (success) {
      setSaving(true);
      try {
        const res = await fetch(`/api/interview/sessions/${id}/submit`, { method: "POST" });
        if (res.ok) {
          router.replace(`/dashboard/interview/${id}/result`);
        }
      } catch (e) {
        console.error(e);
        setSaving(false);
      }
    }
  };

  if (loading || !session) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-cyan" size={32} />
      </div>
    );
  }

  const currentQ = session.answers[currentIdx];
  const isLast = currentIdx === session.numQuestions - 1;

  return (
    <>
      <DashboardHeader 
        title="Active Interview" 
        subtitle="Take your time and answer as comprehensively as you would in a real interview." 
      />

      <Panel className="max-w-3xl mx-auto p-6 md:p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-bold text-cyan tracking-widest font-mono">
            QUESTION {currentIdx + 1} OF {session.numQuestions}
          </div>
          <div className="text-xs text-muted">
            {session.answers.filter(a => a.answerText).length} answered
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-ink leading-relaxed">
            {currentQ.questionText}
          </h2>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-muted mb-2">Your Answer</label>
          <textarea
            className="w-full h-48 p-4 rounded-xl border border-line bg-slate-50 focus:bg-white transition-colors resize-none"
            placeholder="Type your answer here..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-line">
          <Button 
            variant="secondary" 
            onClick={handlePrev} 
            disabled={currentIdx === 0 || saving}
          >
            <ArrowLeft size={16} className="mr-2" /> Previous
          </Button>
          
          {isLast ? (
            <Button onClick={handleSubmit} disabled={saving || !currentAnswer.trim()}>
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <CheckCircle size={16} className="mr-2" />}
              Submit Interview
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={saving || !currentAnswer.trim()}>
              Next <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
        </div>
      </Panel>
    </>
  );
}
