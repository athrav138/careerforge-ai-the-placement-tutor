"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, AlertCircle, ArrowRight } from "lucide-react";
import Panel from "@/components/ui/panel";

interface WeakSkill {
  skill: string;
  skillId: string;
  accuracy: number;
  classification: string;
  priority: string;
  correct: number;
  incorrect: number;
}

export default function WeakSkillsPanel() {
  const [weakSkills, setWeakSkills] = useState<WeakSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeakSkills() {
      try {
        const res = await fetch("/api/aptitude/weak-skills");
        if (res.ok) {
          const data = await res.json();
          const sorted = (data.skills || []).sort((a: WeakSkill, b: WeakSkill) => a.accuracy - b.accuracy).slice(0, 3);
          setWeakSkills(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch weak skills", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeakSkills();
  }, []);

  if (loading) {
    return (
      <Panel className="p-6 rounded-2xl animate-pulse mb-6">
        <div className="h-5 w-1/3 bg-white/10 rounded mb-4"></div>
        <div className="h-20 w-full bg-white/5 rounded"></div>
      </Panel>
    );
  }

  if (weakSkills.length === 0) {
    return null;
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "high":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      default:
        return "border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]";
    }
  };

  return (
    <Panel className="p-6 rounded-2xl mb-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-widest text-[#00f0ff] font-mono font-semibold">APTITUDE GAPS</div>
          <h2 className="mt-2 text-lg font-black text-white">Weak Skills Detected</h2>
        </div>
        <Link
          href="/dashboard/aptitude"
          className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-mono"
        >
          <span>Practice All</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {weakSkills.map((item) => (
          <div
            key={item.skillId}
            className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-white truncate">{item.skill}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase ${getPriorityStyle(
                    item.priority
                  )}`}
                >
                  {item.priority || "Review"}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Accuracy: <span className="font-mono font-bold text-white">{item.accuracy}%</span> ({item.correct}/{item.correct + item.incorrect})
              </div>
            </div>
            <Link
              href={`/dashboard/aptitude`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#00f0ff] hover:text-cyan-300 font-semibold"
            >
              <BrainCircuit size={13} />
              <span>Launch Targeted Drill</span>
            </Link>
          </div>
        ))}
      </div>
    </Panel>
  );
}
