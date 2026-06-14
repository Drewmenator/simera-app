"use client";

import { benchmarks, benchmarkTiers, revenueBySpecialty } from "@/lib/mock-data";
import { useAuditData } from "@/lib/use-audit-data";
import dynamic from "next/dynamic";

// Recharts code-split into its own chunk (out of First Load JS).
const PerformanceRadarChart = dynamic(() => import("@/components/charts/PerformanceRadarChart"), {
  ssr: false, loading: () => <div style={{ height: 220 }} />,
});

/**
 * Converts a practice denial rate (%) to an approximate industry percentile.
 * Lower denial rate = better = higher percentile.
 * Breakpoints derived from MGMA 2023-2024 data.
 */
function denialRateToPercentile(rate: number): number {
  const bp: [number, number][] = [
    [3, 96], [5.2, 90], [7, 80], [9, 70], [11.8, 50],
    [14, 38], [16, 28], [18, 20], [22, 12], [28, 5],
  ];
  if (rate <= bp[0][0]) return bp[0][1];
  if (rate >= bp[bp.length - 1][0]) return bp[bp.length - 1][1];
  for (let i = 0; i < bp.length - 1; i++) {
    const [r0, p0] = bp[i];
    const [r1, p1] = bp[i + 1];
    if (rate >= r0 && rate <= r1) {
      const t = (rate - r0) / (r1 - r0);
      return Math.round(p0 + t * (p1 - p0));
    }
  }
  return 50;
}

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

// radarData is computed inside the component so denial rate can be live
// (declared here as type reference only)

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
  const { metrics, isLive } = useAuditData();

  // When real 835 data is loaded, compute denial rate metrics from actual data.
  // All other metrics (DAR, net collection, etc.) require claims systems not available
  // in 835 files — those rows continue to use industry-representative demo values.
  const denialRatePercentile = isLive
    ? denialRateToPercentile(metrics.denialRate)
    : benchmarks.denialRate.percentile;
  const denialRateValue = isLive
    ? metrics.denialRate
    : benchmarks.denialRate.practice;

  // Radar uses percentile scores (0-100). Only denial rate is live when real data loaded.
  const radarData = [
    { metric: "Denial Rate", practice: denialRatePercentile, median: 50 },
    { metric: "Days in A/R", practice: benchmarks.daysInAR.percentile, median: 50 },
    { metric: "Net Collection", practice: benchmarks.netCollection.percentile, median: 50 },
    { metric: "First Pass", practice: benchmarks.firstPassResolution.percentile, median: 50 },
    { metric: "Clean Claim", practice: benchmarks.cleanClaimRate.percentile, median: 50 },
  ];

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
            name={isLive ? "Denial Rate (from your 835)" : "Denial Rate"}
            percentile={denialRatePercentile}
            practiceVal={`${denialRateValue.toFixed(1)}%`}
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
            <PerformanceRadarChart data={radarData} />
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

      {/* Network Intelligence — the data moat */}
      <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
        <div style={{ background: "#0b2734", padding: "18px 22px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6", margin: "0 0 5px" }}>
              Simera Network Intelligence
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#eaf2f3", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
              Payer Win Rates Across the Simera Network
            </h2>
            <p style={{ fontSize: 13, color: "#8fabb5", margin: 0 }}>
              Every appeal outcome logged by any practice improves predictions for all practices. This is the moat.
            </p>
          </div>
          <div style={{
            flexShrink: 0, padding: "4px 12px", borderRadius: 20,
            background: "rgba(20,184,166,0.18)", color: "#14b8a6",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            SAMPLE DATA
          </div>
        </div>

        <div style={{ padding: "18px 22px" }}>
          <p style={{ fontSize: 13, color: "#5c747e", marginBottom: 18, lineHeight: 1.6 }}>
            As practices upload 835 files and confirm appeal outcomes, Simera builds payer-level denial intelligence that no single practice could compute alone. The table below shows what this looks like — win rates by payer and denial code, derived from aggregated (de-identified) outcomes across the network.
          </p>

          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(11,39,52,0.09)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f3f6f7" }}>
                  {["Payer", "Denial Code", "Network Claims", "Win Rate", "vs. Industry Est.", "Best Action"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#8aa0a8", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(11,39,52,0.09)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { payer: "United Healthcare", code: "CO-4",  n: 847, winRate: 0.72, industry: 0.55, delta: "+17pp", action: "Medical necessity letter + CPT documentation" },
                  { payer: "United Healthcare", code: "CO-97", n: 612, winRate: 0.58, industry: 0.45, delta: "+13pp", action: "Resubmit with modifier -59" },
                  { payer: "Aetna",             code: "CO-45", n: 531, winRate: 0.41, industry: 0.38, delta: "+3pp",  action: "Contract rate review required" },
                  { payer: "BlueCross BlueShield", code: "CO-16", n: 489, winRate: 0.66, industry: 0.52, delta: "+14pp", action: "Missing/invalid field correction + resubmit" },
                  { payer: "Cigna",             code: "PR-1",  n: 378, winRate: 0.31, industry: 0.30, delta: "+1pp",  action: "Patient responsibility — limited recourse" },
                  { payer: "Humana",            code: "CO-4",  n: 294, winRate: 0.63, industry: 0.55, delta: "+8pp",  action: "Prior auth appeal with clinical notes" },
                ].map((row, i) => {
                  const deltaColor = parseFloat(row.delta) > 5 ? "#0c8174" : parseFloat(row.delta) > 0 ? "#9a6a1e" : "#c2553d";
                  const winColor = row.winRate >= 0.6 ? "#0c8174" : row.winRate >= 0.4 ? "#9a6a1e" : "#c2553d";
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfb", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0b2734" }}>{row.payer}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "rgba(11,39,52,0.07)", padding: "2px 7px", borderRadius: 5, color: "#0b2734" }}>
                          {row.code}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#5c747e" }}>{row.n.toLocaleString()}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 52, height: 6, borderRadius: 3, background: "rgba(11,39,52,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${row.winRate * 100}%`, background: winColor, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: winColor }}>{Math.round(row.winRate * 100)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 700, color: deltaColor }}>{row.delta}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#5c747e" }}>{row.action}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, padding: "12px 16px", background: "rgba(20,184,166,0.07)", borderRadius: 10, border: "1px solid rgba(20,184,166,0.18)" }}>
            <div style={{ fontSize: 20 }}>🔒</div>
            <p style={{ fontSize: 12.5, color: "#3a6b60", margin: 0, lineHeight: 1.6 }}>
              <strong>How the data moat works:</strong> Each practice's outcomes are de-identified (payer name + CARC code + won/lost only — no patient data) and pooled. A solo practice might have 30 CO-4 denials with United; the Simera network has 847 and knows exactly what works. The more practices use Simera, the more accurate every practice's recovery predictions become.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
