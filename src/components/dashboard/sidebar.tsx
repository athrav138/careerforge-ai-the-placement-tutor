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
  Compass,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/placement-preparation", label: "Placement Preparation", icon: Compass },
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

  const item = (link: (typeof nav)[number]) => {
    const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(`${link.href}/`));
    return (
      <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${active ? "border-[#00f0ff]/30 bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.18)]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}>
        <link.icon size={17} className={active ? "text-[#00f0ff]" : "text-slate-400"} aria-hidden="true" />
        <span>{link.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#050811] py-6 text-slate-100 md:flex">
      <div className="mb-6 px-5">
        <Link href="/" aria-label="CareerForge AI home" className="flex items-center gap-2.5">
          <BrandLogo className="h-10 w-32" />
        </Link>
      </div>
      <div className="mb-2 px-5 text-[10px] font-mono uppercase tracking-widest text-slate-500">Placement Modules</div>
      <nav aria-label="Dashboard modules" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">{nav.map(item)}</nav>
      <nav aria-label="Account" className="mt-3 flex flex-col gap-1 border-t border-white/10 px-3 pt-3">{bottomNav.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all ${active ? "border-[#00f0ff]/30 bg-[#00f0ff]/15 text-[#00f0ff]" : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"}`}><link.icon size={17} aria-hidden="true" /><span>{link.label}</span></Link>;
      })}</nav>
    </aside>
  );
}