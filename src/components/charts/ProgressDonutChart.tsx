"use client";

// Code-split out of the compliance route (Recharts in its own chunk).
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function ProgressDonutChart({ pct }: { pct: number }) {
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={78}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill="#0c8174" />
          <Cell fill="rgba(11,39,52,0.07)" />
        </Pie>
        <Tooltip formatter={(v) => [`${v}%`]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
