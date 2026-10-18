function CornerMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} width="14" height="14">
      <path d="M1 8V1H8" stroke="#00f0ff" strokeWidth="1.5" fill="none" opacity="0.75" />
    </svg>
  );
}

export default function Panel({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={`relative overflow-hidden border border-white/10 bg-[#0c1322]/85 backdrop-blur-md text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
      <div className="absolute -top-px -left-px">
        <CornerMark />
      </div>
      <div className="absolute -top-px -right-px rotate-90">
        <CornerMark />
      </div>
      <div className="absolute -bottom-px -left-px -rotate-90">
        <CornerMark />
      </div>
      <div className="absolute -bottom-px -right-px rotate-180">
        <CornerMark />
      </div>
      {title && (
        <h2 className="border-b border-white/10 px-5 py-4 text-base font-semibold text-white">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
