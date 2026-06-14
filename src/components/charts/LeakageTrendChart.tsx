"use client";

// Code-split out of the revenue route (Recharts in its own chunk).
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,39,52,0.10)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(11,39,52,0.12)", fontSize: 13 }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "#8aa0a8", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#c2553d", fontWeight: 700 }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

export default function LeakageTrendChart({ data }: { data: { month: string; leakage: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="leakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c2553d" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#c2553d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(11,39,52,0.06)" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} tickFormatter={(v) => `$${v / 1000}K`} />
        <Tooltip content={<CustomAreaTooltip />} />
        <Area type="monotone" dataKey="leakage" stroke="#c2553d" strokeWidth={2.5} fill="url(#leakGrad)" dot={{ fill: "#fff", stroke: "#c2553d", strokeWidth: 2, r: 4 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
