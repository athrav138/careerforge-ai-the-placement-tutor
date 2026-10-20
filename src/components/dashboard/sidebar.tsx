"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  BarChart3,
  Map,
  FileText,
  Calculator,
  Lightbulb,
  Mic,
  LineChart,
  Bot,
  User,
  Settings,
  Sparkles,
  BriefcaseBusiness,
  Bell,
  ListChecks,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/career", label: "Career Fit", icon: Target },
  { href: "/dashboard/skills", label: "Skill Gap", icon: BarChart3 },
  { href: "/dashboard/roadmap", label: "Roadmap", icon: Map },
  { href: "/dashboard/resume", label: "Resume & ATS", icon: FileText },
  { href: "/dashboard/aptitude", label: "Aptitude Drills", icon: Calculator },
  { href: "/dashboard/projects", label: "Projects", icon: Lightbulb },
  { href: "/dashboard/interview", label: "AI Interview", icon: Mic },
  { href: "/dashboard/analytics", label: "Readiness Analytics", icon: LineChart },
  { href: "/dashboard/mentor", label: "AI Mentor", icon: Bot },
  { href: "/dashboard/profile-optimization", label: "Profile Optimizer", icon: Sparkles },
  { href: "/dashboard/jobs", label: "Job Matching", icon: BriefcaseBusiness },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/action-center", label: "Placement Center", icon: ListChecks },
];

const bottomNav = [
  { href: "/dashboard/profile", label: "Student Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const item = (l: (typeof nav)[number]) => {
    const active = pathname === l.href;
    return (
      <Link
        key={l.href}
        href={l.href}
        className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-all rounded-xl ${
          active
            ? "bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.18)]"
            : "border border-transparent text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <l.icon size={17} className={active ? "text-[#00f0ff]" : "text-slate-400"} />
        <span>{l.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#050811] text-slate-100 py-6">
      <div className="px-5 mb-6">
        <Link href="/" aria-label="CareerForge AI home" className="flex items-center gap-2.5 group">
          <BrandLogo className="h-10 w-32" />
        </Link>
      </div>

      <div className="px-5 mb-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
        Placement Modules
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">{nav.map(item)}</nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3 mt-3 px-3">
        {bottomNav.map(item)}
      </div>
    </aside>
  );
}
