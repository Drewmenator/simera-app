"use client";

import { benchmarks, benchmarkTiers, revenueBySpecialty } from "@/lib/mock-data";
import { useAuditData } from "@/lib/use-audit-data";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  letterSpacing: "0.13em",
  textTransform: "uppercase" as const,
  color: "#8aa0a8",
};

function GradeChip({ grade }: { grade: string }) {
  const color = ["A", "B"].includes(grade) ? "#0c8174" : grade === "C" ? "#9a6a1e" : "#c2553d";
  const bg = ["A", "B"].includes(grade) ? "#e4f4f1" : grade === "C" ? "#f8efdd" : "#f8e8e3";
  const border = ["A", "B"].includes(grade) ? "rgba(12,129,116,0.25)" : grade === "C" ? "rgba(189,133,47,0.25)" : "rgba(194,85,61,0.25)";
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <p style={{ ...MONO, marginBottom: 4 }}>Overall Grade</p>
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
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", whiteSpace: "nowrap" }}>{name}</span>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ ...MONO }}>Percentile</p>
          <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: pctColor, fontVariantNumeric: "tabular-nums" }}>{percentile}<sup style={{ fontSize: 13, fontWeight: 600 }}>th</sup></p>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#5c747e", margin: "3px 0 14px" }}>
        Your practice <b style={{ fontWeight: 700 }}>{practiceVal}</b> · Median {medianVal} · Best-in-class {bestVal}
      </p>
      <div style={{ position: "relative", height: 8, borderRadius: 6, background: "linear-gradient(90deg, #e9d9d3, #f0ead7, #dcefe6)", overflow: "visible" }}>
        <div style={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: 2, background: "#8aa0a8", borderRadius: 2 }} />
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
  { metric: "Clean Claim", practice: 44, median: 50 },
];

function TierCell({ value, isHeader }: { value: string; isHeader?: boolean }) {
  return (
    <td style={{
      padding: "12px 14px",
      fontSize: isHeader ? 10.5 : 13,
      fontWeight: isHeader ? 600 : 500,
      color: isHeader ? "#8aa0a8" : "#0b2734",
      fontFamily: isHeader ? "'IBM Plex Mono', monospace" : "inherit",
      letterSpacing: isHeader ? "0.1em" : undefined,
      textTransform: isHeader ? "uppercase" as const : undefined,
      borderBottom: "1px solid rgba(11,39,52,0.06)",
      verticalAlign: "middle",
      whiteSpace: "nowrap",
    }}>
      {value}
    </td>
  );
}

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
              Compared against 1,412 similar independent family-medicine practices (1–10 providers) · Source: MGMA 2023–2024, HFMA
            </p>
          </div>
          <GradeChip grade={metrics.denialGrade} />
        </div>
      </div>

      {/* Main row — KPI bars + radar */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-[14px] md:gap-[18px]">
        {/* Key Performance Metrics */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Key Performance Metrics</h2>

          <BmRow
            name="Denial Rate"
            percentile={benchmarks.denialRate.percentile}
            practiceVal={`${benchmarks.denialRate.practice}%`}
            medianVal={`${benchmarks.denialRate.median}%`}
            bestVal={`<3%`}
            good={false}
          />
          <BmRow
            name="Days in A/R"
            percentile={benchmarks.daysInAR.percentile}
            practiceVal={`${benchmarks.daysInAR.practice}d`}
            medianVal={`${benchmarks.daysInAR.median}d`}
            bestVal={`<25d`}
            good={true}
          />
          <BmRow
            name="Net Collection Rate"
            percentile={benchmarks.netCollection.percentile}
            practiceVal={`${benchmarks.netCollection.practice}%`}
            medianVal={`${benchmarks.netCollection.median}%`}
            bestVal={`≥98%`}
            good={benchmarks.netCollection.percentile >= 50}
          />
          <BmRow
            name="First-Pass Resolution"
            percentile={benchmarks.firstPassResolution.percentile}
            practiceVal={`${benchmarks.firstPassResolution.practice}%`}
            medianVal={`${benchmarks.firstPassResolution.median}%`}
            bestVal={`≥95%`}
            good={false}
          />
          <BmRow
            name="Clean Claim Rate"
            percentile={benchmarks.cleanClaimRate.percentile}
            practiceVal={`${benchmarks.cleanClaimRate.practice}%`}
            medianVal={`${benchmarks.cleanClaimRate.median}%`}
            bestVal={`99.89%`}
            good={false}
          />
          <div style={{ borderBottom: "none" }}>
            <BmRow
              name="Cost to Collect"
              percentile={benchmarks.costToCollect.percentile}
              practiceVal={`${benchmarks.costToCollect.practice}%`}
              medianVal={`${benchmarks.costToCollect.median}%`}
              bestVal={`<2%`}
              good={false}
            />
          </div>
        </div>

        {/* Radar + specialty revenue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...CARD, padding: "22px 24px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Performance Radar</h2>
            <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 14 }}>Your practice vs. median</p>
            <div style={{ display: "flex", gap: 18, marginBottom: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#8aa0a8", display: "inline-block", opacity: 0.5 }} />
                Median
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#14b8a6", display: "inline-block" }} />
                Your practice
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
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
          </div>

          {/* Revenue per physician by specialty */}
          <div style={{ ...CARD, padding: "20px 22px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", margin: "0 0 3px" }}>Revenue per Physician</h3>
            <p style={{ fontSize: 12, color: "#5c747e", marginBottom: 14 }}>Annual average by specialty · MGMA 2024</p>
            {revenueBySpecialty.map((row) => {
              const pct = (row.annualRevenue / 2700000) * 100;
              return (
                <div key={row.specialty} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0b2734" }}>{row.specialty}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#5c747e" }}>
                      ${(row.annualRevenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: "rgba(11,39,52,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#14b8a6", borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Industry Benchmark Tiers table */}
      <div style={{ ...CARD, padding: "22px 24px" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Industry Benchmark Reference</h2>
          <p style={{ fontSize: 13, color: "#5c747e" }}>MGMA 2023–2024 · HFMA · CMS data — what each KPI tier means for your practice</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f6f8f8" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8", borderBottom: "1px solid rgba(11,39,52,0.10)", whiteSpace: "nowrap" }}>KPI</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#0c8174", borderBottom: "1px solid rgba(11,39,52,0.10)", whiteSpace: "nowrap" }}>Best-in-Class</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#0b2734", borderBottom: "1px solid rgba(11,39,52,0.10)", whiteSpace: "nowrap" }}>MGMA Benchmark</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#bd852f", borderBottom: "1px solid rgba(11,39,52,0.10)", whiteSpace: "nowrap" }}>Industry Avg</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#c2553d", borderBottom: "1px solid rgba(11,39,52,0.10)", whiteSpace: "nowrap" }}>Red Flag</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8", borderBottom: "1px solid rgba(11,39,52,0.10)" }}>Key Insight</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkTiers.map((row, i) => (
                <tr key={row.kpi} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfb" }}>
                  <td style={{ padding: "14px 14px", fontSize: 14, fontWeight: 700, color: "#0b2734", borderBottom: "1px solid rgba(11,39,52,0.06)", whiteSpace: "nowrap" }}>{row.kpi}</td>
                  <td style={{ padding: "14px 14px", fontSize: 13, fontWeight: 700, color: "#0c8174", borderBottom: "1px solid rgba(11,39,52,0.06)", whiteSpace: "nowrap" }}>{row.bestInClass}</td>
                  <td style={{ padding: "14px 14px", fontSize: 13, fontWeight: 600, color: "#0b2734", borderBottom: "1px solid rgba(11,39,52,0.06)", whiteSpace: "nowrap" }}>{row.mgmaBenchmark}</td>
                  <td style={{ padding: "14px 14px", fontSize: 13, color: "#bd852f", fontWeight: 600, borderBottom: "1px solid rgba(11,39,52,0.06)", whiteSpace: "nowrap" }}>{row.industryAvg}</td>
                  <td style={{ padding: "14px 14px", fontSize: 13, color: "#c2553d", fontWeight: 700, borderBottom: "1px solid rgba(11,39,52,0.06)", whiteSpace: "nowrap" }}>{row.redFlag}</td>
                  <td style={{ padding: "14px 14px", fontSize: 12.5, color: "#5c747e", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: "#8aa0a8", marginTop: 14 }}>
          Sources: MGMA 2023–2024 Physician Compensation Survey · HFMA Benchmarking Initiative · CMS NHE Fact Sheet · CAQH 2023 Index
        </p>
      </div>
    </div>
  );
}
