import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

const cols = [
  {
    title: "Platform",
    links: [
      { href: "/dashboard/career", label: "Career Recommendation" },
      { href: "/dashboard/skills", label: "Skill Gap Analysis" },
      { href: "/dashboard/resume", label: "Resume Analyzer" },
      { href: "/dashboard/aptitude", label: "Aptitude Practice" },
      { href: "/dashboard/interview", label: "Interview Preparation" },
      { href: "/dashboard/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/dashboard/roadmap", label: "Learning Roadmap" },
      { href: "/dashboard/projects", label: "Projects" },
      { href: "/dashboard/career", label: "Career Guidance" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Login" },
      { href: "/register", label: "Register" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#05050a] py-16 text-slate-300">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-4 gap-10 mb-12">
          <div>
            <BrandLogo className="h-12 w-36" />
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-[260px]">
              The intelligent placement tutor for personalized career guidance, preparation planning, and placement-readiness tracking.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Operational // 99.98% Uptime</span>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs tracking-widest text-[#00f0ff] font-mono mb-4 font-semibold">
                {c.title.toUpperCase()}
              </div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <span>&copy; {new Date().getFullYear()} CareerForge AI. All rights reserved.</span>
          <span>Intelligent Placement Platform v2.4</span>
        </div>
      </div>
    </footer>
  );
}
