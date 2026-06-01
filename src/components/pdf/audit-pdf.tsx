"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import {
  headlineMetrics,
  leakageFindings,
  denialPatterns,
  payerScorecard,
  practiceStats,
} from "@/lib/mock-data";

// ── Styles ──────────────────────────────────────────────────────────────────

const NAVY  = "#1a2744";
const AMBER = "#d4860a";
const GREEN = "#1a7a4a";
const RED   = "#c0392b";
const GRAY  = "#64748b";
const LIGHT = "#f5f7fa";
const WHITE = "#ffffff";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
    paddingBottom: 48,
  },

  // ── Cover ──────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: NAVY,
    flex: 1,
    padding: 56,
    justifyContent: "space-between",
  },
  coverLogo: {
    fontSize: 22,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  coverLogoSub: {
    fontSize: 10,
    color: "#ffffff60",
    marginTop: 2,
  },
  coverHeadline: {
    marginTop: 80,
  },
  coverTitle: {
    fontSize: 11,
    color: "#ffffff60",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverPractice: {
    fontSize: 30,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 11,
    color: "#ffffff70",
    marginBottom: 48,
  },
  coverDivider: {
    height: 1,
    backgroundColor: "#ffffff20",
    marginBottom: 40,
  },
  coverMetricsRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 48,
  },
  coverMetric: {
    flex: 1,
  },
  coverMetricLabel: {
    fontSize: 8,
    color: "#ffffff50",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  coverMetricValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  coverMetricSub: {
    fontSize: 9,
    color: "#ffffff60",
    marginTop: 3,
  },
  coverAmber: { color: "#f5a623" },
  coverGreen: { color: "#4ade80" },
  coverRed:   { color: "#f87171" },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: "#ffffff15",
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverFooterText: {
    fontSize: 9,
    color: "#ffffff40",
  },

  // ── Header (inner pages) ────────────────────────────────────────────────
  pageHeader: {
    backgroundColor: NAVY,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageHeaderLogo: {
    fontSize: 11,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  pageHeaderRight: {
    fontSize: 8,
    color: "#ffffff60",
  },

  // ── Body ───────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },

  sectionTitle: {
    fontSize: 9,
    color: GRAY,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  // ── Headline metrics ────────────────────────────────────────────────────
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metricLabel: {
    fontSize: 7,
    color: GRAY,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  metricSub: {
    fontSize: 8,
    color: GRAY,
  },
  red:   { color: RED },
  green: { color: GREEN },
  amber: { color: AMBER },
  navy:  { color: NAVY },

  // ── Alert box ─────────────────────────────────────────────────────────
  alertBox: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 3,
    borderLeftColor: RED,
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    flexDirection: "row",
    gap: 10,
  },
  alertTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: RED,
    marginBottom: 3,
  },
  alertText: {
    fontSize: 8,
    color: "#7f1d1d",
    lineHeight: 1.5,
  },

  // ── Findings table ─────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 7,
    color: "#ffffff90",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: LIGHT,
  },
  tableCell: {
    fontSize: 8,
    color: "#1e2333",
    lineHeight: 1.5,
  },
  tableCellMuted: {
    fontSize: 7,
    color: GRAY,
    marginTop: 2,
  },

  // Column widths for findings
  colRank:       { width: 20 },
  colCategory:   { width: 90 },
  colDesc:       { flex: 1 },
  colAmount:     { width: 62, textAlign: "right" },
  colRecovery:   { width: 70, textAlign: "right" },
  colDifficulty: { width: 44, textAlign: "right" },

  // ── Payer scorecard ───────────────────────────────────────────────────
  colPayer:       { flex: 1 },
  colClaims:      { width: 44, textAlign: "right" },
  colDenialRate:  { width: 56, textAlign: "right" },
  colGrade:       { width: 36, textAlign: "center" },
  colCollection:  { width: 70, textAlign: "right" },

  // ── Recommended actions ───────────────────────────────────────────────
  actionCard: {
    backgroundColor: LIGHT,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    flex: 1,
    marginRight: 12,
  },
  actionRecovery: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
  },
  actionText: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.6,
  },
  actionPayer: {
    fontSize: 7,
    color: GRAY,
    marginTop: 5,
    letterSpacing: 0.3,
  },

  // ── CTA / footer ──────────────────────────────────────────────────────
  ctaBox: {
    backgroundColor: NAVY,
    borderRadius: 8,
    padding: 24,
    marginTop: 24,
    marginHorizontal: 40,
    marginBottom: 28,
  },
  ctaTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 6,
  },
  ctaBody: {
    fontSize: 9,
    color: "#ffffff80",
    lineHeight: 1.6,
    marginBottom: 14,
  },
  ctaHighlight: {
    color: "#f5a623",
    fontFamily: "Helvetica-Bold",
  },
  ctaFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ffffff15",
    paddingTop: 12,
  },
  ctaUrl: {
    fontSize: 9,
    color: "#f5a623",
    fontFamily: "Helvetica-Bold",
  },
  ctaTagline: {
    fontSize: 8,
    color: "#ffffff50",
  },

  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: {
    fontSize: 7,
    color: "#cbd5e1",
  },
});

// ── Shared page header ───────────────────────────────────────────────────────

function PageHeader({ practice }: { practice: string }) {
  return (
    <View style={s.pageHeader}>
      <Text style={s.pageHeaderLogo}>SIMERA · Revenue Leakage Audit</Text>
      <Text style={s.pageHeaderRight}>{practice} · {practiceStats.dataRange}</Text>
    </View>
  );
}

function PageFooter({ pageNum }: { pageNum: number }) {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.pageFooterText}>
        Confidential · simera.health · Not financial advice — verify before acting
      </Text>
      <Text style={s.pageFooterText}>Page {pageNum}</Text>
    </View>
  );
}

function DifficultyBadge({ d }: { d: string }) {
  const colors: Record<string, string> = {
    easy: GREEN, medium: AMBER, hard: RED,
  };
  return (
    <Text style={[s.tableCell, { color: colors[d] ?? GRAY, fontFamily: "Helvetica-Bold", fontSize: 7 }]}>
      {d.toUpperCase()}
    </Text>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: GREEN, B: GREEN, C: AMBER, D: RED, F: RED,
  };
  return (
    <Text style={[s.tableCell, { color: colors[grade] ?? GRAY, fontFamily: "Helvetica-Bold", textAlign: "center" }]}>
      {grade}
    </Text>
  );
}

// ── The document ─────────────────────────────────────────────────────────────

export function AuditPDFDocument() {
  const practice = practiceStats.name;
  const m = headlineMetrics;
  const actionable = leakageFindings.filter((f) => f.expectedRecovery > 0);

  return (
    <Document
      title={`Simera Revenue Leakage Audit — ${practice}`}
      author="Simera Health"
      subject="Revenue Leakage Audit Report"
    >
      {/* ── Page 1: Cover ─────────────────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <View style={s.coverPage}>
          {/* Logo */}
          <View>
            <Text style={s.coverLogo}>SIMERA</Text>
            <Text style={s.coverLogoSub}>simera.health</Text>
          </View>

          {/* Main headline */}
          <View style={s.coverHeadline}>
            <Text style={s.coverTitle}>Revenue Leakage Audit</Text>
            <Text style={s.coverPractice}>{practice}</Text>
            <Text style={s.coverDate}>
              {practiceStats.dataRange} · Generated {practiceStats.lastUpdated}
            </Text>

            <View style={s.coverDivider} />

            {/* Key metrics */}
            <View style={s.coverMetricsRow}>
              <View style={s.coverMetric}>
                <Text style={s.coverMetricLabel}>Total Leakage Found</Text>
                <Text style={[s.coverMetricValue, s.coverRed]}>
                  ${(m.totalLeakage / 1000).toFixed(0)}K
                </Text>
                <Text style={s.coverMetricSub}>{m.leakageRatePct}% of revenue analyzed</Text>
              </View>
              <View style={s.coverMetric}>
                <Text style={s.coverMetricLabel}>Expected Recovery</Text>
                <Text style={[s.coverMetricValue, s.coverGreen]}>
                  ${(m.expectedRecovery / 1000).toFixed(0)}K
                </Text>
                <Text style={s.coverMetricSub}>probability-weighted</Text>
              </View>
              <View style={s.coverMetric}>
                <Text style={s.coverMetricLabel}>Denial Rate</Text>
                <Text style={[s.coverMetricValue, s.coverAmber]}>
                  {m.denialRate}%
                </Text>
                <Text style={s.coverMetricSub}>Grade {m.denialGrade} · Median: {m.benchmarkMedian}%</Text>
              </View>
            </View>

            <View style={s.coverDivider} />

            <Text style={[s.coverMetricLabel, { marginBottom: 8 }]}>
              Revenue Analyzed: ${m.revenueAnalyzed.toLocaleString()}
              {"  ·  "}
              Providers: {practiceStats.providers}
              {"  ·  "}
              Specialty: {practiceStats.specialty}
            </Text>
          </View>

          {/* Footer */}
          <View style={s.coverFooter}>
            <Text style={s.coverFooterText}>
              Confidential — prepared exclusively for {practice}
            </Text>
            <Text style={s.coverFooterText}>
              simera.health · Get paid what you earned.
            </Text>
          </View>
        </View>
      </Page>

      {/* ── Page 2: Executive Summary ─────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader practice={practice} />
        <View style={s.body}>

          {/* Alert */}
          <View style={s.alertBox}>
            <View>
              <Text style={s.alertTitle}>⚠ ACTION REQUIRED — 38 DAYS REMAINING</Text>
              <Text style={s.alertText}>
                23 United Healthcare CO-197 (prior auth) denials totaling $31,200 have been sitting
                unworked for 142 days. UHC's 180-day appeal window closes July 8, 2026.
                These claims expire permanently if not worked this week.
              </Text>
            </View>
          </View>

          {/* Metrics */}
          <Text style={s.sectionTitle}>Headline Findings</Text>
          <View style={s.metricsGrid}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Revenue Analyzed</Text>
              <Text style={[s.metricValue, s.navy]}>${m.revenueAnalyzed.toLocaleString()}</Text>
              <Text style={s.metricSub}>{practiceStats.dataRange}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Total Leakage Found</Text>
              <Text style={[s.metricValue, s.red]}>${m.totalLeakage.toLocaleString()}</Text>
              <Text style={s.metricSub}>{m.leakageRatePct}% of revenue</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Expected Recovery</Text>
              <Text style={[s.metricValue, s.green]}>${m.expectedRecovery.toLocaleString()}</Text>
              <Text style={s.metricSub}>probability-weighted</Text>
            </View>
          </View>

          <View style={s.metricsGrid}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Denial Rate</Text>
              <Text style={[s.metricValue, s.red]}>{m.denialRate}%</Text>
              <Text style={s.metricSub}>Industry median: {m.benchmarkMedian}%</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Denial Grade</Text>
              <Text style={[s.metricValue, s.red]}>{m.denialGrade}</Text>
              <Text style={s.metricSub}>Best-in-class: {m.benchmarkBest}%</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Net Collection Rate</Text>
              <Text style={[s.metricValue, s.amber]}>
                {(m.netCollectionRate * 100).toFixed(1)}%
              </Text>
              <Text style={s.metricSub}>Industry best: 99.1%</Text>
            </View>
          </View>

          {/* What this means */}
          <Text style={s.sectionTitle}>What This Means</Text>
          <View style={[s.actionCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
            <Text style={[s.actionText, { fontSize: 9, lineHeight: 1.7 }]}>
              Of the <Text style={{ fontFamily: "Helvetica-Bold", color: NAVY }}>${m.revenueAnalyzed.toLocaleString()}</Text> in
              claims analyzed, <Text style={{ fontFamily: "Helvetica-Bold", color: RED }}>${m.totalLeakage.toLocaleString()}</Text> is
              being lost to denials, underpayments, and wrong write-offs.{"\n\n"}
              Based on industry appeal win rates, <Text style={{ fontFamily: "Helvetica-Bold", color: GREEN }}>${m.expectedRecovery.toLocaleString()}</Text> of
              that is realistically recoverable with the actions outlined in this report.
              The remaining ${(m.totalLeakage - m.expectedRecovery).toLocaleString()} includes
              timely filing losses (unrecoverable) and low-confidence appeals.{"\n\n"}
              Your denial rate of <Text style={{ fontFamily: "Helvetica-Bold", color: RED }}>{m.denialRate}%</Text> is
              above the industry median of {m.benchmarkMedian}%. Best-performing practices
              achieve {m.benchmarkBest}%. Reaching even the median would recover an
              estimated <Text style={{ fontFamily: "Helvetica-Bold", color: GREEN }}>$28,400/month</Text> in
              additional revenue — without seeing a single additional patient.
            </Text>
          </View>
        </View>
        <PageFooter pageNum={2} />
      </Page>

      {/* ── Page 3: Recovery Opportunities ───────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader practice={practice} />
        <View style={s.body}>
          <Text style={s.sectionTitle}>Top Recovery Opportunities — Ranked by Expected Recovery</Text>

          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colRank]}>#</Text>
            <Text style={[s.tableHeaderText, s.colCategory]}>Category</Text>
            <Text style={[s.tableHeaderText, s.colDesc]}>Description & Payer</Text>
            <Text style={[s.tableHeaderText, s.colAmount]}>At Risk</Text>
            <Text style={[s.tableHeaderText, s.colRecovery]}>Recovery</Text>
            <Text style={[s.tableHeaderText, s.colDifficulty]}>Effort</Text>
          </View>

          {leakageFindings.map((f, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, s.colRank, { color: GRAY }]}>{i + 1}</Text>
              <View style={s.colCategory}>
                <Text style={s.tableCell}>{f.label}</Text>
              </View>
              <View style={s.colDesc}>
                <Text style={s.tableCell}>{f.description}</Text>
                <Text style={s.tableCellMuted}>{f.payer}</Text>
              </View>
              <Text style={[s.tableCell, s.colAmount, { fontFamily: "Helvetica-Bold" }]}>
                ${f.dollarAmount.toLocaleString()}
              </Text>
              <Text style={[
                s.tableCell,
                s.colRecovery,
                { fontFamily: "Helvetica-Bold", color: f.expectedRecovery > 0 ? GREEN : GRAY }
              ]}>
                {f.expectedRecovery > 0 ? `$${f.expectedRecovery.toLocaleString()}` : "—"}
              </Text>
              <View style={s.colDifficulty}>
                <DifficultyBadge d={f.difficulty} />
              </View>
            </View>
          ))}
        </View>
        <PageFooter pageNum={3} />
      </Page>

      {/* ── Page 4: Recommended Actions ──────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader practice={practice} />
        <View style={s.body}>
          <Text style={s.sectionTitle}>Recommended Actions — This Week</Text>

          {actionable.map((f, i) => (
            <View key={i} style={s.actionCard}>
              <View style={s.actionHeader}>
                <Text style={s.actionTitle}>
                  {i + 1}. {f.label} — {f.payer}
                </Text>
                <Text style={s.actionRecovery}>
                  +${f.expectedRecovery.toLocaleString()}
                </Text>
              </View>
              <Text style={s.actionText}>{f.action}</Text>
              <Text style={s.actionPayer}>
                Denial codes: {f.denialCodes.length > 0 ? f.denialCodes.join(", ") : "N/A"}
                {"  ·  "}
                CPT codes: {f.cptCodes.join(", ")}
                {"  ·  "}
                Win rate: {Math.round(f.recoveryProbability * 100)}%
              </Text>
            </View>
          ))}
        </View>
        <PageFooter pageNum={4} />
      </Page>

      {/* ── Page 5: Payer Scorecard + CTA ────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <PageHeader practice={practice} />
        <View style={s.body}>
          <Text style={s.sectionTitle}>Payer Scorecard — Sorted by Denial Rate</Text>

          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colPayer]}>Payer</Text>
            <Text style={[s.tableHeaderText, s.colClaims]}>Claims</Text>
            <Text style={[s.tableHeaderText, s.colDenialRate]}>Denial Rate</Text>
            <Text style={[s.tableHeaderText, s.colGrade]}>Grade</Text>
            <Text style={[s.tableHeaderText, s.colCollection]}>Net Collection</Text>
          </View>

          {payerScorecard.map((p, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, s.colPayer, { fontFamily: "Helvetica-Bold" }]}>
                {p.payer}
              </Text>
              <Text style={[s.tableCell, s.colClaims]}>{p.claims}</Text>
              <Text style={[s.tableCell, s.colDenialRate, {
                fontFamily: "Helvetica-Bold",
                color: p.denialRate > 15 ? RED : p.denialRate > 10 ? AMBER : GREEN,
              }]}>
                {p.denialRate}%
              </Text>
              <View style={s.colGrade}>
                <GradeBadge grade={p.grade} />
              </View>
              <Text style={[s.tableCell, s.colCollection]}>{p.netCollection}%</Text>
            </View>
          ))}

          {/* Top denial patterns */}
          <Text style={[s.sectionTitle, { marginTop: 24 }]}>Top Denial Patterns</Text>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { width: 100 }]}>Payer</Text>
            <Text style={[s.tableHeaderText, { width: 40 }]}>Code</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>Description</Text>
            <Text style={[s.tableHeaderText, { width: 40, textAlign: "right" }]}>Claims</Text>
            <Text style={[s.tableHeaderText, { width: 64, textAlign: "right" }]}>At Risk</Text>
            <Text style={[s.tableHeaderText, { width: 48, textAlign: "right" }]}>Priority</Text>
          </View>
          {denialPatterns.slice(0, 6).map((p, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 100 }]}>{p.payer}</Text>
              <Text style={[s.tableCell, { width: 40, fontFamily: "Helvetica-Bold" }]}>{p.code}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{p.description}</Text>
              <Text style={[s.tableCell, { width: 40, textAlign: "right" }]}>{p.claims}</Text>
              <Text style={[s.tableCell, { width: 64, textAlign: "right", color: RED }]}>
                ${p.atRisk.toLocaleString()}
              </Text>
              <Text style={[s.tableCell, { width: 48, textAlign: "right",
                color: p.priority === "HIGH" ? RED : p.priority === "MEDIUM" ? AMBER : GREEN,
                fontFamily: "Helvetica-Bold", fontSize: 7,
              }]}>
                {p.priority}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={s.ctaBox}>
          <Text style={s.ctaTitle}>
            Subscribe to Simera — recover ${(m.expectedRecovery / 1000).toFixed(0)}K this quarter
          </Text>
          <Text style={s.ctaBody}>
            This audit was run manually as part of our free audit offer.{"\n"}
            Simera subscribers get continuous monitoring — every new 835 file analyzed automatically,
            appeal deadlines tracked, payer patterns detected before they become losses.{"\n\n"}
            <Text style={s.ctaHighlight}>
              Annual subscription: $7,188 · First month free · Cancel anytime.
            </Text>
            {"  "}The first recovered claim typically covers the full year.
          </Text>
          <View style={s.ctaFooterRow}>
            <Text style={s.ctaUrl}>simera.health</Text>
            <Text style={s.ctaTagline}>Get paid what you earned. Today.</Text>
          </View>
        </View>

        <PageFooter pageNum={5} />
      </Page>
    </Document>
  );
}

// ── Download trigger ─────────────────────────────────────────────────────────

export async function downloadAuditPDF(practiceName?: string) {
  const { default: saveAs } = await import("file-saver");
  const blob = await pdf(<AuditPDFDocument />).toBlob();
  const filename = `Simera_Audit_${(practiceName ?? practiceStats.name).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  saveAs(blob, filename);
}
