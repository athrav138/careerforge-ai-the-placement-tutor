"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReadinessSnapshot } from "@/lib/readiness-analytics";

export default function ReadinessHistoryChart({ history }: { history: ReadinessSnapshot[] }) {
  const accessibleSummary = history
    .map((item) => `${new Date(item.date).toLocaleDateString()}: ${item.readiness} percent`)
    .join("; ");

  return (
    <div
      className="h-64 w-full sm:h-80"
      role="img"
      aria-label={`${history.length} saved readiness snapshots. ${accessibleSummary}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#263449" />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
            }
            stroke="#94a3b8"
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} unit="%" stroke="#94a3b8" width={48} />
          <Tooltip
            labelFormatter={(value) => new Date(String(value)).toLocaleDateString()}
            formatter={(value) => [`${value}%`, "Recorded readiness"]}
            contentStyle={{ background: "#101a2b", border: "1px solid #334155", borderRadius: 12 }}
          />
          <Line
            type="monotone"
            dataKey="readiness"
            name="Recorded readiness"
            stroke="#00d9f5"
            strokeWidth={3}
            dot={{ r: 4, fill: "#00d9f5" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
