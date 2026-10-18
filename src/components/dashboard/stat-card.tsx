import type { LucideIcon } from "lucide-react";
import Panel from "@/components/ui/panel";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "cyan" | "forge" | "success" | "warning";
};

const accentStyles = {
  cyan: "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]",
  forge: "bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
};

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "cyan",
}: StatCardProps) {
  return (
    <Panel className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#00f0ff]/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.12)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="text-xs font-mono tracking-[0.16em] text-slate-400">{label.toUpperCase()}</div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentStyles[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-black font-mono text-white tracking-tight">{value}</div>
      <div className="mt-2 text-sm leading-relaxed text-slate-400">{detail}</div>
    </Panel>
  );
}
