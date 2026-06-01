"use client";

import { benchmarks, practiceStats } from "@/lib/mock-data";
import { useAuditData } from "@/lib/use-audit-data";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend,
} from "recharts";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

function GradeChip({ grade }: { grade: string }) {
  const color = ["A", "B"].includes(grade) ? "#0c8174" : grade === "C" ? "#9a6a1e" : "#c2553d";
  const bg = ["A", "B"].includes(grade) ? "#e4f4f1" : grade === "C" ? "#f8efdd" : "#f8e8e3";
  const border = ["A", "B"].includes(grade) ? "rgba(12,129,116,0.25)" : grade === "C" ? "rgba(189,133,47,0.25)" : "rgba(194,85,61,0.25)";
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8", marginBottom: 4 }}>Overall Grade</p>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: bg, color, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
        {grade}
      </div>
    </div>
  );
}

interface BmRowProps {
  name: string;
  percentile: number;
  practiceVal: string;
  medianVal: string;
  bestVal: string;
  good: boolean;
}

function BmRow({ name, percentile, practiceVal, medianVal, bestVal, good }: BmRowProps) {
  const dotColor = good ? "#0c8174" : percentile < 40 ? "#c2553d" : "#bd852f";
  const pctColor = good ? "#0c8174" : percentile < 40 ? "#c2553d" : "#bd852f";
  const medianPos = 50; // visual median position
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", whiteSpace: "nowrap" }}>{name}</span>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>Percentile</p>
          <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: pctColor, fontVariantNumeric: "tabular-nums" }}>{percentile}<sup style={{ fontSize: 13, fontWeight: 600 }}>th</sup></p>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#5c747e", margin: "3px 0 14px" }}>
        Your practice <b style={{ fontWeight: 700 }}>{practiceVal}</b> · Median {medianVal} · Best-in-class {bestVal}
      </p>
      {/* Track */}
      <div style={{ position: "relative", height: 8, borderRadius: 6, background: "linear-gradient(90deg, #e9d9d3, #f0ead7, #dcefe6)", overflow: "visible" }}>
        {/* Median tick */}
        <div style={{ position: "absolute", left: `${medianPos}%`, top: -4, bottom: -4, width: 2, background: "#8aa0a8", borderRadius: 2 }} />
        {/* Practice dot */}
        <div style={{ position: "absolute", left: `${percentile}%`, top: "50%", width: 16, height: 16, borderRadius: "50%", background: dotColor, transform: "translate(-50%, -50%)", border: "3px solid #fff", boxShadow: "0 1px 4px rgba(11,39,52,0.3)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8aa0a8", marginTop: 9, fontFamily: "'IBM Plex Mono', monospace" }}>
        <span>Worst</span>
        <span>Best</span>
      </div>
    </div>
  );
}

const radarData = [
  { metric: "Denial Rate", practice: 22, median: 50 },
  { metric: "Days in A/R", practice: 68, median: 50 },
  { metric: "Net Collection", practice: 42, median: 50 },
  { metric: "First Pass", practice: 38, median: 50 },
  { metric: "Clean Claim", practice: 45, median: 50 },
];

export default function BenchmarksPage() {
  const { metrics } = useAuditData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Header card */}
      <div style={{ ...CARD, padding: "22px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Practice Performance Benchmark</h2>
            <p style={{ fontSize: 13.5, color: "#5c747e" }}>
              Compared against 1,412 similar independent family-medicine practices (1–10 providers)
            </p>
          </div>
          <GradeChip grade={metrics.denialGrade} />
        </div>
      </div>

      {/* Main row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }}>
        {/* Key Performance Metrics */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Key Performance Metrics</h2>

          <BmRow
            name="Denial Rate"
            percentile={benchmarks.denialRate.percentile}
            practiceVal={`${benchmarks.denialRate.practice}%`}
            medianVal={`${benchmarks.denialRate.median}%`}
            bestVal={`${benchmarks.denialRate.best}%`}
            good={false}
          />
          <BmRow
            name="Days in A/R"
            percentile={benchmarks.daysInAR.percentile}
            practiceVal={`${benchmarks.daysInAR.practice}d`}
            medianVal={`${benchmarks.daysInAR.median}d`}
            bestVal={`${benchmarks.daysInAR.best}d`}
            good={true}
          />
          <BmRow
            name="Net Collection Rate"
            percentile={benchmarks.netCollection.percentile}
            practiceVal={`${benchmarks.netCollection.practice}%`}
            medianVal={`${benchmarks.netCollection.median}%`}
            bestVal={`${benchmarks.netCollection.best}%`}
            good={benchmarks.netCollection.percentile >= 50}
          />
          <div style={{ borderBottom: "none" }}>
            <BmRow
              name="First-Pass Resolution"
              percentile={benchmarks.firstPassResolution.percentile}
              practiceVal={`${benchmarks.firstPassResolution.practice}%`}
              medianVal={`${benchmarks.firstPassResolution.median}%`}
              bestVal={`${benchmarks.firstPassResolution.best}%`}
              good={false}
            />
          </div>
        </div>

        {/* Radar chart */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Performance Radar</h2>
          <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 18 }}>Your practice vs. median</p>

          {/* Legend */}
          <div style={{ display: "flex", gap: 18, marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#8aa0a8", display: "inline-block", opacity: 0.5 }} />
              Median
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: "#14b8a6", display: "inline-block" }} />
              Your practice
            </span>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(11,39,52,0.10)" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8", letterSpacing: "0.04em" }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Median" dataKey="median" stroke="#8aa0a8" fill="#8aa0a8" fillOpacity={0.12} strokeWidth={1.5} dot={{ fill: "#8aa0a8", r: 3 }} />
              <Radar name="Your practice" dataKey="practice" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.18} strokeWidth={2} dot={{ fill: "#14b8a6", r: 4 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
