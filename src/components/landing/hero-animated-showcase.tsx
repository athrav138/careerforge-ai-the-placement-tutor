"use client";

import { useState } from "react";
import {
  BrainCircuit,
  FileSearch,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";

const showcaseModes = [
  {
    id: "core",
    label: "Career Intelligence Core",
    icon: BrainCircuit,
    video: "/videos/career-intelligence-core.mp4",
    title: "AI-Powered Placement Engine",
    subtitle: "Real-time market alignment & predictive readiness scoring",
    telemetry: {
      score: "92%",
      scoreLabel: "Market Fit Index",
      badge: "Target: Software Development Engineer",
      status: "Neural Model Active",
    },
  },
  {
    id: "resume",
    label: "Resume & Skill Engine",
    icon: FileSearch,
    video: "/videos/resume-skill-analysis.mp4",
    title: "Deep Skill-Gap & ATS Diagnostics",
    subtitle: "Automated keyword matching & personalized project recommendations",
    telemetry: {
      score: "96%",
      scoreLabel: "ATS Keyword Match",
      badge: "5 High-Value Gaps Identified",
      status: "Parser Synchronized",
    },
  },
];

export default function HeroAnimatedShowcase() {
  const [activeTab, setActiveTab] = useState<"core" | "resume">("core");
  const currentMode = showcaseModes.find((m) => m.id === activeTab) || showcaseModes[0];

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#00f0ff]/20 via-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl opacity-50 pointer-events-none -z-10" />

      {/* Cyber Window Container */}
      <div className="relative rounded-2xl border border-white/15 bg-[#0c1322]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.12)] overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-[#050811]/90">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-[11px] text-slate-400">
              CAREERFORGE // TELEMETRY
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10">
            {showcaseModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeTab === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setActiveTab(mode.id as "core" | "resume")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={13} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-[#00f0ff]">
            <span className="h-2 w-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#05050a]">
          <video
            key={currentMode.video}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-85 transition-opacity duration-700"
            src={currentMode.video}
          />

          {/* Cyber scanline and vignette overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1322] via-transparent to-transparent opacity-80" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,10,0.6)_100%)]" />

          {/* Floating Telemetry HUD - Top Right */}
          <div className="absolute top-4 right-4 max-w-[200px] rounded-xl border border-white/15 bg-[#050811]/90 backdrop-blur-md p-3 shadow-xl">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Activity size={12} className="text-[#00f0ff]" />
                {currentMode.telemetry.scoreLabel}
              </span>
              <span className="font-bold text-[#00f0ff] text-xs">
                {currentMode.telemetry.score}
              </span>
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-200 truncate">
              {currentMode.telemetry.badge}
            </div>
          </div>

          {/* Floating Telemetry HUD - Bottom Left */}
          <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-white/15 bg-[#050811]/90 backdrop-blur-md p-3.5 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                {currentMode.telemetry.status}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white">{currentMode.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{currentMode.subtitle}</p>
          </div>
        </div>

        {/* Feature Highlights Footer Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-t border-white/10 bg-[#050811]/95 text-[11px] text-slate-300">
          <div className="p-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#00f0ff] shrink-0" />
            <span className="truncate">Skill-Gap & Aptitude Scoring</span>
          </div>
          <div className="p-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate">Sprint Milestones</span>
          </div>
          <div className="p-3 flex items-center gap-2">
            <Layers size={14} className="text-purple-400 shrink-0" />
            <span className="truncate">AI Mock Simulator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
