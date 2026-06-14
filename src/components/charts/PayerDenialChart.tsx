"use client";

// Code-split out of the revenue route (Recharts in its own chunk).
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

export default function PayerDenialChart({ data }: { data: { payer: string; rate: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" barSize={16} margin={{ left: 12, right: 50 }}>
        <CartesianGrid horizontal={false} stroke="rgba(11,39,52,0.06)" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} tickFormatter={(v) => `${v}%`} domain={[0, 28]} />
        <YAxis type="category" dataKey="payer" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#0b2734", fontWeight: 500 }} width={44} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Denial Rate"]} />
        <ReferenceLine x={11.8} stroke="#bd852f" strokeDasharray="4 3" label={{ value: "Median", position: "top", fontSize: 10, fill: "#bd852f", fontFamily: "'IBM Plex Mono', monospace" }} />
        <ReferenceLine x={5.2} stroke="#14b8a6" strokeDasharray="4 3" label={{ value: "Best", position: "top", fontSize: 10, fill: "#14b8a6", fontFamily: "'IBM Plex Mono', monospace" }} />
        <Bar dataKey="rate" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fill: "#5c747e", formatter: (v: unknown) => `${Number(v).toFixed(1)}%` }}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
