"use client";

// Code-split out of the benchmarks route (Recharts in its own chunk).
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function PerformanceRadarChart({ data }: { data: { metric: string; median: number; practice: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
        <PolarGrid stroke="rgba(11,39,52,0.10)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, fill: "#8aa0a8", letterSpacing: "0.04em" }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Median" dataKey="median" stroke="#8aa0a8" fill="#8aa0a8" fillOpacity={0.12} strokeWidth={1.5} dot={{ fill: "#8aa0a8", r: 3 }} />
        <Radar name="Your practice" dataKey="practice" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.18} strokeWidth={2} dot={{ fill: "#14b8a6", r: 4 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
