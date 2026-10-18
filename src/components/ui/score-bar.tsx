export default function ScoreBar({
  label,
  value,
  accent = "#00f0ff",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono font-bold text-white">{safeValue}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${safeValue}%`,
            background: accent,
            boxShadow: `0 0 10px ${accent}66`,
          }}
        />
      </div>
    </div>
  );
}
