"use client";

// Code-split out of the dashboard route so Recharts loads as its own chunk
// (perf: keeps ~Recharts out of First Load JS). Rendered via next/dynamic, ssr:false.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,39,52,0.10)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(11,39,52,0.12)", fontSize: 13 }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "#8aa0a8", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

export default function RevenueLeakageChart({ data }: { data: { month: string; Paid: number; Leakage: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={26} barGap={4}>
        <defs>
          <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1aa595" />
            <stop offset="100%" stopColor="#0c8174" />
          </linearGradient>
          <linearGradient id="gradLeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d2674f" />
            <stop offset="100%" stopColor="#c2553d" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(11,39,52,0.06)" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8", letterSpacing: "0.04em" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} tickFormatter={(v) => `$${v / 1000}K`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Paid" fill="url(#gradPaid)" radius={[5, 5, 0, 0]} name="Paid" />
        <Bar dataKey="Leakage" fill="url(#gradLeak)" radius={[5, 5, 0, 0]} name="Leakage" />
      </BarChart>
    </ResponsiveContainer>
  );
}
