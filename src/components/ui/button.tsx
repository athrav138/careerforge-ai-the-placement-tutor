import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  icon?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
  icon = true,
  type = "button",
  disabled = false,
  onClick,
}: Props) {
  const base =
    "text-sm font-semibold px-6 py-3 inline-flex items-center justify-center gap-2 transition-all duration-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#00f0ff]/20 disabled:pointer-events-none disabled:opacity-60 cursor-pointer";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-600 via-blue-500 to-[#00d8ea] text-white shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:brightness-110"
      : "border border-white/15 bg-white/5 text-slate-200 backdrop-blur-md hover:-translate-y-0.5 hover:border-[#00f0ff]/50 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]";
  const cls = `${base} ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
        {icon && <ArrowRight size={15} />}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
      {icon && <ArrowRight size={15} />}
    </button>
  );
}
