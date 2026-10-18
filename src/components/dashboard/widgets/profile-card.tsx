"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import Panel from "@/components/ui/panel";
import { CheckCircle2, Mail, UserRound } from "lucide-react";

export default function ProfileCard() {
  const [session, setSession] = useState<{ name: string; email: string; onboardingComplete: boolean } | null>(null);
  const [profile, setProfile] = useState<{ college: string; degree: string; targetRole: string; skills: string } | null>(null);

  useEffect(() => {
    getSession().then(setSession);
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { profile?: typeof profile }) => setProfile(data.profile ?? null));
  }, []);

  if (!session) return null;

  return (
    <Panel className="rounded-2xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.2em] text-[#00f0ff] font-mono font-semibold">STUDENT PROFILE</div>
          <h2 className="mt-2 text-xl font-black text-white">{session.name}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <UserRound size={22} />
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Mail size={16} className="text-[#00f0ff] shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-400">Email</div>
            <div className="truncate font-semibold text-white">{session.email}</div>
          </div>
        </div>
        {profile ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-slate-400">Education</div>
              <div className="font-semibold text-white">{profile.degree || "Degree pending"}{profile.college ? ` · ${profile.college}` : ""}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-slate-400">Target role</div>
              <div className="font-semibold text-white">{profile.targetRole || "Not set"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs text-slate-400">Skills</div>
              <div className="font-semibold text-white">{profile.skills || "Add skills from Edit profile"}</div>
            </div>
          </>
        ) : null}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <CheckCircle2 size={16} className={session.onboardingComplete ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
          <div>
            <div className="text-xs text-slate-400">Status</div>
            <div className="font-semibold text-white">
              {session.onboardingComplete ? "Profile Complete & Calibrated" : "Onboarding Incomplete"}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
