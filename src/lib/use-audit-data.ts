"use client";

/**
 * useAuditData — returns dashboard-ready data from either:
 *   1. A live AuditResult from an uploaded 835 file (via AuditContext), or
 *   2. The static mock data (demo mode fallback)
 *
 * Shape is always identical so pages don't need to branch.
 */

import { useAuditContext } from "@/lib/audit-context";
import {
  headlineMetrics,
  practiceStats,
  leakageFindings,
  denialPatterns,
  payerScorecard,
  revenueByMonth,
  risks,
} from "@/lib/mock-data";

// ─── Shared types ────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  revenueAnalyzed: number;
  totalLeakage: number;
  expectedRecovery: number;
  leakageRatePct: number;
  denialRate: number;
  denialGrade: string;
  benchmarkMedian: number;
  benchmarkBest: number;
  netCollectionRate: number; // weighted average net collection rate across payers (0–1 scale)
}

export interface DashboardFinding {
  rank: number;
  label: string;
  description: string;
  dollarAmount: number;
  expectedRecovery: number;
  recoveryProbability: number;
  difficulty: string;
  payer: string;
  action: string;
  denialCodes: string[];
  cptCodes: string[];
  category: string;
}

export interface DashboardPayer {
  payer: string;
  claims: number;
  denialRate: number;
  grade: string;
  netCollection: number;
  atRisk: number;
}

export interface DashboardDenialPattern {
  payer: string;
  code: string;
  description: string;
  category: string;
  claims: number;
  atRisk: number;
  priority: string;
  trend: string;
}

export interface DashboardData {
  isLive: boolean;
  /**
   * true when the API parsed the 835 but returned total_leakage = 0 with no
   * top_findings — leakage was estimated from payer scorecard denial rates.
   * The UI shows an amber "Estimated" notice in this state.
   */
  isEstimatedLeakage: boolean;
  practiceName: string;
  dataRange: string;
  metrics: DashboardMetrics;
  findings: DashboardFinding[];
  payerScorecard: DashboardPayer[];
  denialPatterns: DashboardDenialPattern[];
  revenueByMonth: typeof revenueByMonth;
  risks: typeof risks;
  /** Count of critical + high severity risk items — drives the Risks nav badge */
  criticalCount: number;
}

// ─── Mock → Dashboard shape ──────────────────────────────────────────────────

function mockData(): DashboardData {
  const mockRisks = risks; // typed alias to avoid shadowing
  return {
    isLive: false,
    isEstimatedLeakage: false,
    practiceName: practiceStats.name,
    dataRange: practiceStats.dataRange,
    metrics: {
      revenueAnalyzed: headlineMetrics.revenueAnalyzed,
      totalLeakage: headlineMetrics.totalLeakage,
      expectedRecovery: headlineMetrics.expectedRecovery,
      leakageRatePct: headlineMetrics.leakageRatePct,
      denialRate: headlineMetrics.denialRate,
      denialGrade: headlineMetrics.denialGrade,
      benchmarkMedian: headlineMetrics.benchmarkMedian,
      benchmarkBest: headlineMetrics.benchmarkBest,
      netCollectionRate: 0.942,
    },
    criticalCount: mockRisks.filter((r) => r.severity === "critical" || r.severity === "high").length,
    findings: leakageFindings.map((f) => ({
      rank: f.rank,
      label: f.label,
      description: f.description,
      dollarAmount: f.dollarAmount,
      expectedRecovery: f.expectedRecovery,
      recoveryProbability: f.recoveryProbability,
      difficulty: f.difficulty,
      payer: f.payer,
      action: f.action,
      denialCodes: f.denialCodes,
      cptCodes: f.cptCodes,
      category: f.category,
    })),
    payerScorecard: payerScorecard.map((p) => ({
      payer: p.payer,
      claims: p.claims,
      denialRate: p.denialRate,
      grade: p.grade,
      netCollection: p.netCollection,
      atRisk: p.atRisk,
    })),
    denialPatterns: denialPatterns.map((d) => ({
      payer: d.payer,
      code: d.code,
      description: d.description,
      category: d.category,
      claims: d.claims,
      atRisk: d.atRisk,
      priority: d.priority,
      trend: d.trend,
    })),
    revenueByMonth,
    risks: mockRisks,
  };
}

// ─── API result → Dashboard shape ───────────────────────────────────────────

function fromApiResult(r: NonNullable<ReturnType<typeof useAuditContext>["result"]>): DashboardData {
  const h = r.headline;

  // ── Step 1: map whatever findings the API returned ───────────────────────
  let findings: DashboardFinding[] = r.top_findings.map((f, i) => ({
    rank: f.rank ?? i + 1,
    label: labelFromCategory(f.category),
    description: f.description,
    dollarAmount: f.dollar_amount,
    expectedRecovery: f.expected_recovery,
    recoveryProbability: f.recovery_probability,
    difficulty: f.difficulty,
    payer: f.payer_name,
    action: f.recommended_action,
    denialCodes: f.denial_codes,
    cptCodes: f.cpt_codes,
    category: f.category,
  }));

  // ── Step 2: leakage estimation fallback ───────────────────────────────────
  // The backend sometimes parses the 835 correctly (denial rates, revenue) but
  // returns total_leakage = 0 with no top_findings because the leakage
  // computation step didn't run. When we detect this, estimate leakage from
  // the payer scorecard so the user sees real numbers instead of $0.
  let totalLeakage = h.total_leakage;
  let totalExpectedRecovery = h.expected_recovery;
  let leakageRatePct = h.leakage_rate_pct;
  let isEstimatedLeakage = false;

  // Also check if the API returned findings but all have $0 dollar amounts
  const findingsDollars = findings.reduce((s, f) => s + f.dollarAmount, 0);
  const leakageMissing = totalLeakage === 0 && h.denial_rate_pct > 0 && r.payer_scorecard.length > 0;

  if (leakageMissing && findingsDollars === 0) {
    // Estimate average value per paid claim
    const totalPaidClaims = r.payer_scorecard.reduce(
      (s, p) => s + p.total_claims * (1 - p.denial_rate_pct / 100), 0
    );
    const totalClaimsAll = r.payer_scorecard.reduce((s, p) => s + p.total_claims, 0);
    const avgClaimValue = (totalPaidClaims > 0 ? totalPaidClaims : totalClaimsAll) > 0
      ? h.total_revenue_analyzed / (totalPaidClaims > 0 ? totalPaidClaims : totalClaimsAll)
      : 0;

    // One estimated finding per payer that has denials
    const estimatedFindings: DashboardFinding[] = r.payer_scorecard
      .filter(p => p.denial_rate_pct > 0 && p.total_claims > 0)
      .map((p) => {
        const deniedClaims = Math.round(p.total_claims * p.denial_rate_pct / 100);
        const dollarAmount = Math.round(deniedClaims * avgClaimValue);
        const expectedRec = Math.round(dollarAmount * 0.65);
        return {
          rank: 0,
          label: "Unworked Denials",
          description: `${p.payer_name}: ${deniedClaims} denied claim${deniedClaims !== 1 ? "s" : ""} at ${p.denial_rate_pct.toFixed(1)}% denial rate`,
          dollarAmount,
          expectedRecovery: expectedRec,
          recoveryProbability: 0.65,
          difficulty: "medium" as const,
          payer: p.payer_name,
          action: `Review all denied claims from ${p.payer_name} in your payer portal. Identify denial reason codes and submit appeals within the payer's appeal window.`,
          denialCodes: [],
          cptCodes: [],
          category: "unworked_denial",
        };
      })
      .sort((a, b) => b.dollarAmount - a.dollarAmount)
      .slice(0, 5)
      .map((f, i) => ({ ...f, rank: i + 1 }));

    if (estimatedFindings.length > 0) {
      findings = estimatedFindings;
      totalLeakage = estimatedFindings.reduce((s, f) => s + f.dollarAmount, 0);
      totalExpectedRecovery = estimatedFindings.reduce((s, f) => s + f.expectedRecovery, 0);
      leakageRatePct = h.total_revenue_analyzed > 0
        ? Math.round(totalLeakage / h.total_revenue_analyzed * 1000) / 10
        : 0;
      isEstimatedLeakage = true;
    }
  }

  // ── Step 3: weighted net collection rate ─────────────────────────────────
  const totalClaims = r.payer_scorecard.reduce((s, p) => s + p.total_claims, 0);
  const weightedNetCollection = totalClaims > 0
    ? r.payer_scorecard.reduce((s, p) => s + p.net_collection_rate_pct * p.total_claims, 0) / totalClaims
    : 94.2;

  // ── Step 4: payer scorecard — atRisk now uses estimated findings too ──────
  const payers: DashboardPayer[] = r.payer_scorecard.map((p) => ({
    payer: p.payer_name,
    claims: p.total_claims,
    denialRate: p.denial_rate_pct,
    grade: p.denial_grade,
    netCollection: p.net_collection_rate_pct,
    atRisk: findings
      .filter((f) => f.payer === p.payer_name)
      .reduce((sum, f) => sum + f.dollarAmount, 0),
  }));

  // ── Step 5: denial patterns ───────────────────────────────────────────────
  const patterns: DashboardDenialPattern[] = r.denial_patterns.map((d) => ({
    payer: d.payer_name,
    code: d.denial_code,
    description: d.denial_description,
    category: d.category,
    claims: d.claim_count,
    atRisk: d.total_at_risk,
    priority: d.priority,
    trend: "stable",
  }));

  // ── Step 6: synthetic revenue chart ──────────────────────────────────────
  const totalBilled = h.total_revenue_analyzed + totalLeakage;
  const syntheticChart = [
    {
      month: "Analyzed",
      billed: Math.round(totalBilled),
      paid: Math.round(h.total_revenue_analyzed),
      denied: Math.round(totalLeakage * 0.8),
      leakage: Math.round(totalLeakage),
    },
  ];

  // ── Step 7: synthetic risks from findings ────────────────────────────────
  const syntheticRisks = findings
    .filter((f) => f.expectedRecovery > 0)
    .slice(0, 4)
    .map((f, i) => {
      const daysToDeadline = f.category === "timely_filing" ? 7
        : f.category === "unworked_denial" ? 21
        : f.category === "wrong_writeoff" ? 30
        : null;
      const deadlineDate = daysToDeadline != null
        ? new Date(Date.now() + daysToDeadline * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null;
      return {
        id: `rf-${i}`,
        severity: f.expectedRecovery > 15000 ? "critical" : f.expectedRecovery > 8000 ? "high" : "medium",
        title: f.description,
        description: f.action,
        dollarAmount: f.dollarAmount,
        deadline: deadlineDate,
        action: f.action,
        category: labelFromCategory(f.category),
      };
    });

  // ── Step 8: data range ────────────────────────────────────────────────────
  const start = r.analysis_period.start
    ? new Date(r.analysis_period.start).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  const end = r.analysis_period.end
    ? new Date(r.analysis_period.end).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";

  return {
    isLive: true,
    isEstimatedLeakage,
    practiceName: r.practice_name,
    dataRange: `${start} – ${end}`,
    metrics: {
      revenueAnalyzed: h.total_revenue_analyzed,
      totalLeakage,
      expectedRecovery: totalExpectedRecovery,
      leakageRatePct,
      denialRate: h.denial_rate_pct,
      denialGrade: h.denial_grade,
      benchmarkMedian: h.benchmark_denial_rate_median,
      benchmarkBest: h.benchmark_denial_rate_best,
      netCollectionRate: weightedNetCollection / 100,
    },
    criticalCount: syntheticRisks.filter((r) => r.severity === "critical" || r.severity === "high").length,
    findings,
    payerScorecard: payers,
    denialPatterns: patterns,
    revenueByMonth: syntheticChart as typeof revenueByMonth,
    risks: syntheticRisks,
  };
}

function labelFromCategory(cat: string): string {
  const map: Record<string, string> = {
    unworked_denial: "Unworked Denials",
    underpayment: "Underpayments",
    wrong_writeoff: "Wrong Write-offs",
    undercoding: "Undercoding",
    timely_filing: "Timely Filing Losses",
  };
  return map[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Empty state (production — no audit uploaded yet) ────────────────────────

function emptyData(): DashboardData {
  return {
    isLive: false,
    isEstimatedLeakage: false,
    practiceName: "Your Practice",
    dataRange: "—",
    metrics: {
      revenueAnalyzed: 0,
      totalLeakage: 0,
      expectedRecovery: 0,
      leakageRatePct: 0,
      denialRate: 0,
      denialGrade: "—",
      benchmarkMedian: 11.8,
      benchmarkBest: 5.2,
      netCollectionRate: 0,
    },
    criticalCount: 0,
    findings: [],
    payerScorecard: [],
    denialPatterns: [],
    revenueByMonth: [],
    risks: [],
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseAuditDataResult extends DashboardData {
  isLoading: boolean;
  hasData: boolean;
}

export function useAuditData(): UseAuditDataResult {
  const { result, isLoading } = useAuditContext();

  // Read user's saved practice name override
  const savedName = typeof window !== "undefined"
    ? (localStorage.getItem("simera:settings:practiceName") ?? "")
    : "";

  if (result) {
    const data = fromApiResult(result);
    return {
      ...data,
      practiceName: savedName || data.practiceName,
      isLoading: false,
      hasData: true,
    };
  }

  // Always return demo data immediately — whether the API check is in-flight or done.
  // Never return emptyData() here: that caused totalLeakage = 0 during the 1-3 s API
  // round-trip, which the user perceived as "total leakage missing."
  // When a real 835 is uploaded the `if (result)` branch above takes over.
  const data = mockData();
  return {
    ...data,
    practiceName: savedName || data.practiceName,
    isLoading: false, // mock data is always ready — no reason to block render
    hasData: true,
  };
}
