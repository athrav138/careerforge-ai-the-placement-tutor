import Panel from "@/components/ui/panel";
import Gauge from "@/components/ui/gauge";
import ScoreBar from "@/components/ui/score-bar";

type ReadinessPanelProps = {
  readiness: {
    overallScore: number;
    metrics: {
      career: { score: number };
      skills: { score: number };
      resume: { score: number };
      aptitude: { score: number };
      interview: { score: number };
      learning: { score: number };
    };
  } | null;
};

export default function ReadinessPanel({ readiness }: ReadinessPanelProps) {
  const metrics = readiness?.metrics;
  return (
    <Panel className="rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.2em] text-[#00f0ff] font-mono font-semibold">PLACEMENT READINESS</div>
          <h2 className="mt-2 text-xl font-black text-white">Momentum Snapshot</h2>
        </div>
        <div className="rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1 text-xs font-semibold text-[#00f0ff] font-mono shadow-[0_0_12px_rgba(0,240,255,0.2)]">
          Live AI Index
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <Gauge value={readiness?.overallScore ?? 0} />
        </div>
        <div className="flex-1 w-full space-y-3.5">
          <ScoreBar label="Career Match" value={metrics?.career.score ?? 0} accent="#00f0ff" />
          <ScoreBar label="Technical Skills" value={metrics?.skills.score ?? 0} accent="#10b981" />
          <ScoreBar label="Resume ATS" value={metrics?.resume.score ?? 0} accent="#3b82f6" />
          <ScoreBar label="Aptitude Mastery" value={metrics?.aptitude.score ?? 0} accent="#8b5cf6" />
          <ScoreBar label="Interview Confidence" value={metrics?.interview.score ?? 0} accent="#f59e0b" />
          <ScoreBar label="Learning Progress" value={metrics?.learning.score ?? 0} accent="#00f0ff" />
        </div>
      </div>
    </Panel>
  );
}
