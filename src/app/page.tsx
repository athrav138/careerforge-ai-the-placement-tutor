import {
  ArrowDown,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Compass,
  FileSearch,
  Layers3,
  LineChart,
  MessagesSquare,
  Rocket,
  Route,
  Sparkles,
  Target,
} from "lucide-react";
import SiteNav from "@/components/site-nav";
import SiteFooter from "@/components/site-footer";
import Panel from "@/components/ui/panel";
import Button from "@/components/ui/button";
import ScoreBar from "@/components/ui/score-bar";
import SectionLabel from "@/components/ui/section-label";
import JourneyMap from "@/components/dashboard/journey-map";
import HeroAnimatedShowcase from "@/components/landing/hero-animated-showcase";

const valueStrip = [
  { title: "Personalized Preparation", icon: Target },
  { title: "AI-Powered Guidance", icon: BrainCircuit },
  { title: "Role-Based Learning", icon: BriefcaseBusiness },
  { title: "Continuous Progress Tracking", icon: LineChart },
  { title: "One Unified Platform", icon: Layers3 },
];

const beforeFlow = [
  "Multiple Disconnected Tools",
  "Scattered Learning Resources",
  "Unclear Skill & Resume Gaps",
  "Unstructured Exam Practice",
  "Blind Interview Readiness",
];

const afterFlow = [
  "One Unified Intelligence Core",
  "Personalized Market Analysis",
  "Pinpoint Skill-Gap Remediation",
  "Adaptive Sprint Preparation",
  "Live Placement Readiness Telemetry",
];

const workflow = [
  {
    title: "Create Your Profile",
    body: "Add education, skills, interests, projects, certifications, experience, and target career goals.",
  },
  {
    title: "Understand Your Career",
    body: "Review suitable career and role recommendations dynamically calibrated to industry benchmarks.",
  },
  {
    title: "Identify Skill Gaps",
    body: "Compare your current skills with explicit expectations of your target role.",
  },
  {
    title: "Build Your Preparation Plan",
    body: "Follow a roadmap with skills, curated resources, projects, aptitude, resume, and interview drills.",
  },
  {
    title: "Track Placement Readiness",
    body: "Monitor telemetry and placement performance with real-time actionable recommendations.",
  },
];

const modules = [
  {
    title: "Career Recommendation",
    body: "Discover suitable career roles based on your skills, interests, academic profile, and industry market demands.",
    icon: Compass,
  },
  {
    title: "Skill Gap Analyzer",
    body: "Identify missing and weak skills by comparing your profile with live target-role specifications.",
    icon: BarChart3,
  },
  {
    title: "Personalized Roadmap",
    body: "Follow a structured, milestone-driven learning roadmap designed specifically for your skill gaps.",
    icon: Route,
  },
  {
    title: "Resume Analyzer",
    body: "Analyze your resume with AI to optimize structure, content density, metrics, and hiring impact.",
    icon: FileSearch,
  },
  {
    title: "ATS Optimization",
    body: "Maximize resume parser compatibility by diagnosing missing industry keywords and formatting friction.",
    icon: ClipboardCheck,
  },
  {
    title: "Project Recommendations",
    body: "Discover relevant production-ready project architectures that demonstrate real engineering mastery.",
    icon: Code2,
  },
  {
    title: "Aptitude Practice",
    body: "Master quantitative, logical, and verbal reasoning modules with timed sprints and skill analytics.",
    icon: Calculator,
  },
  {
    title: "Interview Preparation",
    body: "Drill technical, behavioral, and HR interview questions with automated AI evaluation.",
    icon: MessagesSquare,
  },
  {
    title: "Placement Readiness Analytics",
    body: "Track 6+ readiness dimensions with an overarching live placement readiness index.",
    icon: LineChart,
  },
  {
    title: "AI Career Mentor",
    body: "Receive on-demand contextual advice for technical queries, resume pivots, and interview preparation.",
    icon: Bot,
  },
];

const personalizationInputs = ["Student Profile", "Skills", "Career Goal", "Resume", "Performance"];

const roles = [
  "Software Development Engineer",
  "Full Stack Developer",
  "AI / Machine Learning Engineer",
  "Data Scientist",
  "Cloud & DevOps Engineer",
  "Data Engineer",
];

const resumeJourney = [
  "Resume Upload",
  "Deep ATS Parsing",
  "Skill Gap Detection",
  "Project Recommendations",
  "Aptitude Sprints",
  "Mock Interviews",
  "Evidence Verification",
  "Placement Offer",
];

const readinessMetrics = [
  { label: "Technical Skills", value: 88, accent: "#00f0ff" },
  { label: "Resume ATS Score", value: 92, accent: "#10b981" },
  { label: "Aptitude Accuracy", value: 78, accent: "#3b82f6" },
  { label: "Interview Confidence", value: 84, accent: "#f59e0b" },
  { label: "Engineering Projects", value: 85, accent: "#8b5cf6" },
  { label: "Professional Evidence", value: 90, accent: "#00f0ff" },
];

const traditional = [
  "Scattered bookmarks & disconnected tools",
  "Generic non-targeted preparation advice",
  "No visibility into ATS resume filters",
  "Manual guessing of company skill bars",
  "Zero progress telemetry before interviews",
];

const careerForge = [
  "Unified intelligent placement ecosystem",
  "Hyper-personalized role-based learning",
  "Production ATS parser & diagnostic scoring",
  "Live skill gap mapping against industry specs",
  "Continuous 360-degree readiness telemetry",
  "Verified GitHub and LinkedIn evidence sync",
];

const futureEnhancements = [
  "Company-specific hiring intelligence hubs",
  "Predictive company placement matching",
  "Multi-modal video interview coaching",
  "Cryptographically verified career portfolio",
];

const heroStats = [
  { label: "Placement Telemetry", value: "360°" },
  { label: "Integrated Modules", value: "10" },
  { label: "Live Readiness Accuracy", value: "94%" },
];

function FlowColumn({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  return (
    <div>
      <div className="mb-4 text-xs font-mono tracking-[0.2em] text-[#00f0ff] font-semibold">{label}</div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item}>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0c1322]/80 backdrop-blur-md px-4 py-3 shadow-md">
              <span className={`h-2.5 w-2.5 rounded-full ${accent} shadow-sm`} />
              <span className="text-sm font-semibold text-slate-200">{item}</span>
            </div>
            {index < items.length - 1 ? (
              <div className="flex h-5 items-center justify-center text-slate-500">
                <ArrowDown size={14} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="landing-page bg-[#05050a] text-slate-100">
      <SiteNav />

      {/* Hero Section */}
      <section className="landing-hero max-w-6xl mx-auto px-6 pt-14 pb-16 grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
        <div>
          <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3.5 py-1.5 text-xs tracking-[0.2em] text-[#00f0ff] font-mono shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Sparkles size={13} className="text-[#00f0ff]" />
            <span>CAREERFORGE AI</span>
            <span className="text-white/30">/</span>
            <span>PLACEMENT TUTOR</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6 text-white text-left">
            Forge Your Placement Success with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#00f0ff] to-cyan-300">
              Intelligent AI Guidance
            </span>
          </h1>

          <p className="text-base md:text-lg leading-relaxed mb-8 max-w-xl text-slate-300 text-left">
            Prepare for placements with personalized career guidance, skill-gap analysis, resume optimization,
            aptitude practice, interview preparation, and continuous placement-readiness tracking in one intelligent platform.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button href="/register" className="!px-6 !py-3 !text-sm">
              Start Your Placement Journey
            </Button>
            <Button href="#features" variant="secondary" icon={false} className="!px-6 !py-3 !text-sm">
              Explore Platform <ChevronRight size={15} />
            </Button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-10 grid max-w-lg grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1322]/80 backdrop-blur-md shadow-xl">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border-r border-white/10 px-4 py-3.5 last:border-r-0">
                <div className="text-2xl font-black font-mono text-[#00f0ff]">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Showcase Featuring Video Engine */}
        <div className="w-full">
          <HeroAnimatedShowcase />
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="landing-section border-y border-white/10 bg-[#070b14]/90 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00f0ff] inline-block animate-pulse" />
              Connected Placement Preparation System
            </div>
            <div className="text-xs font-mono tracking-[0.18em] text-[#00f0ff]">
              REAL-TIME ARCHITECTURE
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {valueStrip.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="landing-float flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0c1322]/80 px-4 py-3.5 shadow-sm transition-all hover:border-[#00f0ff]/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                >
                  <Icon size={18} className="text-[#00f0ff] shrink-0" />
                  <span className="text-sm font-semibold text-slate-200">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="landing-section max-w-6xl mx-auto px-6 py-20">
        <SectionLabel>THE PARADIGM SHIFT</SectionLabel>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 text-white">
              Placement Preparation Should Not Be Fragmented
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Students juggle separate portals for resumes, test preps, mock questions, coding projects, and job boards.
              CareerForge AI replaces this guesswork with an interconnected intelligence pipeline where every test,
              project, and resume review strengthens your placement readiness score.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <FlowColumn label="TRADITIONAL / DISCONNECTED" items={beforeFlow} accent="bg-amber-400" />
            <FlowColumn label="CAREERFORGE AI / UNIFIED" items={afterFlow} accent="bg-[#00f0ff]" />
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section id="how" className="landing-section border-t border-white/10 bg-[#070b14]/60 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <SectionLabel>HOW CAREERFORGE AI WORKS</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-12 max-w-2xl text-white">
            A cohesive trajectory from onboarding to offer letter.
          </h2>
          <div className="grid gap-5 md:grid-cols-5">
            {workflow.map((step, index) => (
              <div
                key={step.title}
                className="landing-card relative rounded-2xl border border-white/10 bg-[#0c1322]/85 backdrop-blur-md p-5 shadow-lg transition-all hover:border-[#00f0ff]/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-sm font-black font-mono text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Platform Modules Grid */}
      <section id="features" className="landing-section max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <SectionLabel>CORE PLATFORM MODULES</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 max-w-2xl text-white">
          Engineered for every stage of your campus recruitment.
        </h2>
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-slate-300">
          CareerForge AI links every major preparation pillar so actions taken in one module automatically
          inform your customized roadmap, aptitude focus, and interview recommendations.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Panel
                key={module.title}
                className="landing-card group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f0ff]/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#00f0ff] transition-all group-hover:border-[#00f0ff]/50 group-hover:bg-[#00f0ff]/20 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500 group-hover:text-[#00f0ff] transition-colors">
                    MOD_{String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{module.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{module.body}</p>
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Personalization Pipeline Section */}
      <section className="landing-section border-t border-white/10 bg-[#070b14]/60 py-20">
        <div className="max-w-6xl mx-auto px-6 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
          <div>
            <SectionLabel>PERSONALIZATION PIPELINE</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 text-white">
              Dynamic Guidance Tailored to Your Specific Profile
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              No generic tutorials or one-size-fits-all roadmaps. CareerForge AI synthesizes your academic background,
              GitHub repositories, uploaded resume, and aptitude diagnostics to formulate high-impact, custom sprints.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#0c1322]/90 backdrop-blur-md p-6 shadow-2xl">
            <div className="grid gap-3 sm:grid-cols-5">
              {personalizationInputs.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs font-semibold text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="flex h-10 items-center justify-center text-[#00f0ff]">
              <ArrowDown size={18} />
            </div>
            <div className="rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/10 p-5 text-center shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <BrainCircuit className="mx-auto mb-2 text-[#00f0ff]" size={26} />
              <div className="font-black text-white text-base">Neural Skill & Match Processing</div>
            </div>
            <div className="flex h-10 items-center justify-center text-[#00f0ff]">
              <ArrowDown size={18} />
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center font-bold text-emerald-400 text-sm">
              Adaptive Milestones & Verified Placement Readiness
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles Grid */}
      <section className="landing-section max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <SectionLabel>ROLE-BASED CURRICULA</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-white">
          Prepare Specifically for Your Desired Role
        </h2>
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-slate-300">
          Target the exact skill bars, coding standards, and interview formats demanded by top technology employers.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role}
              className="landing-card rounded-2xl border border-white/10 bg-[#0c1322]/85 p-6 transition-all hover:border-[#00f0ff]/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.12)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
                  <BriefcaseBusiness size={20} />
                </div>
                <h3 className="text-base font-bold text-white">{role}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Core Competencies", "System Design", "Aptitude Drills", "Mock Rounds"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Placement Readiness Section */}
      <section className="landing-section max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] items-center">
          <div>
            <SectionLabel>PLACEMENT READINESS TELEMETRY</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 text-white">
              Know Exactly Where You Stand Before Day One
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Stop wondering if your preparation is sufficient. CareerForge AI continuously calculates your
              readiness across all 6 critical dimensions, providing concrete milestones to turn weak skills into strengths.
            </p>
          </div>
          <Panel className="rounded-2xl p-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="text-xs font-mono tracking-[0.2em] text-[#00f0ff]">LIVE PLACEMENT INDEX</div>
                <div className="mt-2 text-5xl font-black font-mono text-white">
                  88<span className="text-[#00f0ff] text-2xl">/100</span>
                </div>
              </div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 font-mono">
                HIGH READINESS PROBABILITY
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {readinessMetrics.map((metric) => (
                <ScoreBar key={metric.label} label={metric.label} value={metric.value} accent={metric.accent} />
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* Journey Map Section */}
      <section className="landing-section border-t border-white/10 bg-[#070b14]/60 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Panel className="p-6 sm:p-8 rounded-2xl">
            <div className="mb-6">
              <div className="text-xs tracking-widest text-[#00f0ff] font-mono uppercase">
                COMPREHENSIVE STUDENT ROADMAP
              </div>
              <h2 className="mt-2 text-2xl md:text-3xl font-black text-white">Your Preparation Map</h2>
            </div>
            <JourneyMap />
          </Panel>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/10">
        <SectionLabel>THE ADVANTAGE</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-12 text-white">
          A cleaner, smarter way to secure top placements.
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="landing-card rounded-2xl border border-white/10 bg-[#0c1322]/60 p-6 sm:p-8">
            <h3 className="mb-5 text-xl font-black text-slate-400">Traditional Preparation</h3>
            <div className="space-y-4">
              {traditional.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="landing-card rounded-2xl border border-[#00f0ff]/40 bg-[#0c1322]/90 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,240,255,0.12)]">
            <h3 className="mb-5 text-xl font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-[#00f0ff]" />
              CareerForge AI Ecosystem
            </h3>
            <div className="space-y-4">
              {careerForge.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-100">
                  <CheckCircle2 size={18} className="text-[#00f0ff] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="landing-section max-w-6xl mx-auto px-6 py-24 border-t border-white/10">
        <Panel className="landing-cta rounded-3xl p-8 sm:p-14 text-center">
          <div className="inline-flex mb-5 items-center justify-center rounded-full border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-4 py-1.5 text-xs tracking-[0.2em] text-[#00f0ff] font-mono shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Sparkles size={14} className="mr-2" />
            READY TO STAND OUT?
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 text-white">
            Start Building Your Placement Readiness Today
          </h2>
          <p className="mb-8 max-w-2xl mx-auto text-base leading-relaxed text-slate-300">
            Diagnose your strengths, close high-priority skill gaps, build a verified engineering profile,
            and head into company interviews with complete confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/register" className="!px-8 !py-3.5 !text-base">
              Start Your Journey
            </Button>
            <Button href="#features" variant="secondary" icon={false} className="!px-8 !py-3.5 !text-base">
              Explore All Modules <ChevronRight size={16} />
            </Button>
          </div>
        </Panel>
      </section>

      <SiteFooter />
    </div>
  );
}
