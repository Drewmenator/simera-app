"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, Zap, ShieldAlert, ArrowRight, CheckCircle2, Clock, Mail, FileDown } from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";
import { useFindingStatuses, findingId } from "@/lib/use-finding-statuses";
import { daysUntil, deadlineLabel, deadlineColor, deadlineBg } from "@/lib/deadlines";
import { EmailReportModal } from "@/components/email/email-report-modal";
import dynamic from "next/dynamic";

// Recharts is code-split into its own chunk (keeps it out of First Load JS).
const RevenueLeakageChart = dynamic(() => import("@/components/charts/RevenueLeakageChart"), {
  ssr: false,
  loading: () => <div style={{ height: 220 }} />,
});

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, accent, icon: Icon, grade,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  accent: string;
  icon: React.ElementType;
  grade?: string;
}) {
  const iconBg = accent === "#0b2734" ? "#e9eded"
    : accent === "#c2553d" ? "#f8e8e3"
    : accent === "#0c8174" ? "#e4f4f1"
    : "#f8efdd";
  return (
    <div style={{ ...CARD_STYLE, padding: "14px 14px 12px", position: "relative", overflow: "hidden" }}>
      {/* Left rail */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent, opacity: 0.9 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8aa0a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <div style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg, color: accent, flexShrink: 0 }}>
          <Icon style={{ width: 12, height: 12 }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 8 }}>
        <div className="kpi-value" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: accent === "#0b2734" ? "#0b2734" : accent, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        {grade && (
          <GradeChip grade={grade} size="sm" />
        )}
      </div>
      <div style={{ fontSize: 11, color: "#5c747e", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}

function GradeChip({ grade, size = "md" }: { grade: string; size?: "sm" | "md" }) {
  const color = ["A", "B"].includes(grade) ? "#0c8174" : grade === "C" ? "#9a6a1e" : "#c2553d";
  const bg = ["A", "B"].includes(grade) ? "#e4f4f1" : grade === "C" ? "#f8efdd" : "#f8e8e3";
  const border = ["A", "B"].includes(grade) ? "rgba(12,129,116,0.25)" : grade === "C" ? "rgba(189,133,47,0.25)" : "rgba(194,85,61,0.25)";
  const sz = size === "sm" ? { width: 30, height: 30, borderRadius: 8, fontSize: 15 } : { width: 54, height: 54, borderRadius: 14, fontSize: 30 };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: bg, color, border: `1px solid ${border}`, fontWeight: 800, letterSpacing: "-0.02em", ...sz }}>
      {grade}
    </div>
  );
}

export default function HomePage() {
  const [emailOpen, setEmailOpen] = useState(false);
  const { metrics, findings, payerScorecard, revenueByMonth, risks, dataRange, practiceName, isLoading, hasData, isEstimatedLeakage } = useAuditData();
  const { getStatus, getRecoveredAmount } = useFindingStatuses();

  // Sum actual recovered amounts; fall back to expected recovery if not recorded
  const recoveredAmount = findings.reduce((sum, f) => {
    const fid = findingId(f.label, f.payer);
    if (getStatus(fid) !== "resolved") return sum;
    const actual = getRecoveredAmount(fid);
    return sum + (actual > 0 ? actual : f.expectedRecovery ?? 0);
  }, 0);

  const topOpps = findings.filter((f) => f.expectedRecovery > 0).slice(0, 4);
  const topRisks = risks.slice(0, 3);

  const chartData = revenueByMonth.map((m) => ({ month: m.month, Paid: m.paid, Leakage: m.leakage }));

  const gradeColor = (g: string) => ["A", "B"].includes(g) ? "#0c8174" : g === "C" ? "#9a6a1e" : "#c2553d";

  const denialRateColor = (r: number) => r > 15 ? "#c2553d" : r > 10 ? "#bd852f" : "#0c8174";

  // ── Deadline data ─────────────────────────────────────────────────────────
  const upcomingDeadlines = risks
    .filter((r) => {
      if (!r.deadline) return false;
      const d = daysUntil(r.deadline);
      return d !== null && d <= 14;
    })
    .map((r) => ({ ...r, days: daysUntil(r.deadline) as number }))
    .sort((a, b) => a.days - b.days);

  const earliestDeadline = upcomingDeadlines[0]
    ? new Date(upcomingDeadlines[0].deadline!).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Skeleton KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[14px] md:gap-[18px]">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ ...CARD_STYLE, padding: "20px 22px 18px", height: 104 }}>
              <div style={{ height: 10, width: "60%", background: "#e9eded", borderRadius: 6, marginBottom: 14 }} />
              <div style={{ height: 36, width: "80%", background: "#f0f4f4", borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <div style={{ ...CARD_STYLE, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8aa0a8", letterSpacing: "0.08em" }}>
            Loading your audit data…
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 480, gap: 20, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "#e4f4f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap style={{ width: 30, height: 30, color: "#0c8174" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0b2734", letterSpacing: "-0.03em", marginBottom: 8 }}>
            No audit data yet
          </h2>
          <p style={{ fontSize: 14, color: "#5c747e", maxWidth: 360, lineHeight: 1.6 }}>
            Upload your first 835 ERA file to see your revenue leakage, denial patterns, and recovery opportunities.
          </p>
        </div>
        <Link
          href="/onboarding"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 24px",
            borderRadius: 12,
            background: "#0b2734",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Upload 835 File
          <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    const { downloadAuditPDF } = await import("@/components/pdf/audit-pdf");
    downloadAuditPDF({ practiceName, metrics, findings, payerScorecard, denialPatterns: [] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Email modal */}
      <EmailReportModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        auditData={{ practiceName, dataRange, totalLeakage: metrics.totalLeakage, expectedRecovery: metrics.expectedRecovery }}
      />

      {/* Action bar */}
      {hasData && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => setEmailOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              height: 34, padding: "0 14px", borderRadius: 9,
              border: "1px solid rgba(11,39,52,0.14)", background: "#fff",
              color: "#0b2734", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 2px rgba(11,39,52,0.06)",
            }}
          >
            <Mail style={{ width: 14, height: 14 }} />
            Email report
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              height: 34, padding: "0 14px", borderRadius: 9,
              border: "1px solid rgba(11,39,52,0.14)", background: "#fff",
              color: "#0b2734", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 1px 2px rgba(11,39,52,0.06)",
            }}
          >
            <FileDown style={{ width: 14, height: 14 }} />
            Download PDF
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[14px] md:gap-[18px]">
        <KpiCard
          label="Revenue Analyzed"
          value={fmt(metrics.revenueAnalyzed)}
          sub={<>{dataRange}</>}
          accent="#0b2734"
          icon={DollarSign}
        />
        <KpiCard
          label="Total Leakage"
          value={fmt(metrics.totalLeakage)}
          sub={<>{metrics.leakageRatePct.toFixed(1)}% of revenue</>}
          accent="#c2553d"
          icon={TrendingUp}
        />
        <KpiCard
          label="Expected Recovery"
          value={fmt(metrics.expectedRecovery)}
          sub="Probability-weighted"
          accent="#0c8174"
          icon={Zap}
        />
        <KpiCard
          label="Denial Rate"
          value={`${metrics.denialRate.toFixed(1)}%`}
          sub={<>Median {metrics.benchmarkMedian}% · Best {metrics.benchmarkBest}%</>}
          accent="#bd852f"
          icon={ShieldAlert}
          grade={metrics.denialGrade}
        />
        <KpiCard
          label="Recovered"
          value={fmt(recoveredAmount)}
          sub={recoveredAmount === 0
            ? <span style={{ color: "#aabec5" }}>No findings resolved yet</span>
            : "Marked resolved"
          }
          accent="#0c8174"
          icon={CheckCircle2}
        />
      </div>

      {/* Estimated-leakage notice */}
      {isEstimatedLeakage && (
        <div style={{
          padding: "10px 16px", borderRadius: 10,
          background: "#f8efdd", border: "1px solid rgba(189,133,47,0.28)",
          color: "#9a6a1e", fontSize: 13, display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 15 }}>⚡</span>
          <span><b>Leakage estimated from denial rates</b> — exact dollar amounts weren&apos;t returned by the API. Numbers reflect your payer denial rates × average claim value. Re-upload to get precise figures.</span>
        </div>
      )}

      {/* Row 2: chart + opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-[14px] md:gap-[18px]">
        {/* Revenue vs Leakage chart */}
        <div style={{ ...CARD_STYLE, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>Revenue vs. Leakage</h2>
              <p style={{ fontSize: 12.5, color: "#5c747e", marginTop: 3 }}>Monthly paid revenue vs. leakage</p>
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#14b8a6", display: "inline-block" }} />
                Paid
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5c747e", fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#c2553d", display: "inline-block" }} />
                Leakage
              </span>
            </div>
          </div>
          <RevenueLeakageChart data={chartData} />
        </div>

        {/* Top Opportunities */}
        <div style={{ ...CARD_STYLE, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>Top Opportunities</h2>
            <Link href="/revenue" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#0c8174", textDecoration: "none" }}>
              See all <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div>
            {topOpps.map((f, i) => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < topOpps.length - 1 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, color: "#8aa0a8", width: 16, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: "#0b2734", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</p>
                  <p style={{ fontSize: 12, color: "#5c747e", marginTop: 1 }}>{f.payer} · {f.difficulty}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#0c8174", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>+{fmt(f.expectedRecovery)}</p>
                  <p style={{ fontSize: 11, color: "#8aa0a8", marginTop: 1, textTransform: "capitalize" }}>{f.difficulty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: active risks + payer scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.55fr] gap-[14px] md:gap-[18px]">
        {/* Active Risks */}
        <div style={{ ...CARD_STYLE, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>Active Risks</h2>
            <Link href="/risks" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#0c8174", textDecoration: "none" }}>
              All risks <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div>
            {topRisks.map((r, i) => {
              const dot = r.severity === "critical" ? "#c2553d" : r.severity === "high" ? "#bd852f" : "#d8a93f";
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 0", borderBottom: i < topRisks.length - 1 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#0b2734", lineHeight: 1.3 }}>{r.title}</p>
                    <p style={{ fontSize: 12, color: "#5c747e", marginTop: 3 }}>
                      <b style={{ color: "#0b2734", fontVariantNumeric: "tabular-nums" }}>{fmt(r.dollarAmount)}</b>
                      {r.deadline && <> · Due {new Date(r.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payer Scorecard */}
        <div style={{ ...CARD_STYLE, padding: "22px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>Payer Scorecard</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Payer", "Denial Rate", "Grade", "At Risk"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8", fontWeight: 500, padding: "0 0 12px", borderBottom: "1px solid rgba(11,39,52,0.10)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payerScorecard.slice(0, 5).map((p, i) => (
                <tr key={p.payer}>
                  <td style={{ fontSize: 14, fontWeight: 600, color: "#0b2734", padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                    {p.payer}
                  </td>
                  <td style={{ textAlign: "right", fontSize: 14, fontVariantNumeric: "tabular-nums", color: denialRateColor(p.denialRate), fontWeight: 600, padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                    {p.denialRate.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "right", padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: ["A","B"].includes(p.grade) ? "#e4f4f1" : p.grade === "C" ? "#f8efdd" : "#f8e8e3", color: gradeColor(p.grade), fontWeight: 800, fontSize: 15, border: `1px solid ${["A","B"].includes(p.grade) ? "rgba(12,129,116,0.25)" : p.grade === "C" ? "rgba(189,133,47,0.25)" : "rgba(194,85,61,0.25)"}` }}>
                      {p.grade}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#c2553d", padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                    {fmt(p.atRisk)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Due This Week */}
      {upcomingDeadlines.length > 0 && (
        <div>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 18, height: 18, color: "#bd852f" }} />
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>
                Due This Week
              </h2>
            </div>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: "#f8efdd",
              color: "#9a6a1e",
              border: "1px solid rgba(189,133,47,0.25)",
            }}>
              {upcomingDeadlines.length}
            </span>
          </div>

          {/* Horizontal scrollable row of deadline cards */}
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
            {upcomingDeadlines.map((risk) => {
              const days = risk.days;
              const isUrgent = days <= 3;
              const railColor = deadlineColor(days);
              const labelText = deadlineLabel(days);
              const labelColor = deadlineColor(days);
              const labelBg = deadlineBg(days);

              return (
                <div
                  key={risk.id}
                  style={{
                    ...CARD_STYLE,
                    width: 220,
                    minWidth: 220,
                    padding: 16,
                    borderRadius: 14,
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {/* Left rail colored by urgency */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: railColor }} />

                  {/* URGENT badge */}
                  {isUrgent && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "#f8e8e3",
                      color: "#c2553d",
                      border: "1px solid rgba(194,85,61,0.25)",
                      marginBottom: 8,
                    }}>
                      URGENT
                    </div>
                  )}

                  {/* Title */}
                  <p style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#0b2734",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: isUrgent ? 0 : 4,
                    marginBottom: 6,
                  }}>
                    {risk.title}
                  </p>

                  {/* Dollar amount */}
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#c2553d", fontVariantNumeric: "tabular-nums", marginBottom: 8 }}>
                    {fmt(risk.dollarAmount)} at risk
                  </p>

                  {/* Deadline label */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                    <Clock style={{ width: 12, height: 12, color: labelColor, flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: labelColor,
                      background: labelBg,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}>
                      {labelText}
                    </span>
                  </div>

                  {/* Take action link */}
                  <Link
                    href="/risks"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#0c8174",
                      textDecoration: "none",
                    }}
                  >
                    Take action <ArrowRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
