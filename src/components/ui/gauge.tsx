export default function Gauge({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
  const cx = 160;
  const cy = 200;
  const r = 120;
  const pct = safeValue / 100;
  const endAngle = 180 - pct * 180;
  const rad = (endAngle * Math.PI) / 180;
  const ex = cx + r * Math.cos(rad);
  const ey = cy - r * Math.sin(rad);

  return (
    <svg viewBox="0 0 320 260" className="w-full max-w-sm mx-auto">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f0ff" floodOpacity="0.4" />
        </filter>
      </defs>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${ex} ${ey}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="14"
        strokeLinecap="round"
        filter="url(#gaugeGlow)"
      />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />
      <circle cx={cx} cy={cy} r="6" fill="#00f0ff" />
      <circle cx={cx} cy={cy} r="2" fill="#05050a" />
      <text
        x={cx}
        y={cy - 34}
        textAnchor="middle"
        fill="#ffffff"
        fontSize="44"
        fontWeight="800"
        fontFamily="ui-monospace, monospace"
      >
        {safeValue}
      </text>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="#00f0ff"
        fontSize="11"
        letterSpacing="2"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
      >
        PLACEMENT READY
      </text>
      <text
        x={cx - r}
        y={cy + 24}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        0
      </text>
      <text
        x={cx + r}
        y={cy + 24}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        100
      </text>
    </svg>
  );
}
