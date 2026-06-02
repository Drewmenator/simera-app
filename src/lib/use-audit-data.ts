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
  practiceName: string;
  dataRange: string;
  metrics: DashboardMetrics;
  findings: DashboardFinding[];
  payerScorecard: DashboardPayer[];
  denialPatterns: DashboardDenialPattern[];
  revenueByMonth: typeof revenueByMonth;
  risks: typeof risks;
}

// ─── Mock → Dashboard shape ──────────────────────────────────────────────────

function mockData(): DashboardData {
  return {
    isLive: false,
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
    },
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
    risks,
  };
}

// ─── API result → Dashboard shape ───────────────────────────────────────────

function fromApiResult(r: NonNullable<ReturnType<typeof useAuditContext>["result"]>): DashboardData {
  const h = r.headline;

  // Map API findings to dashboard shape
  const findings: DashboardFinding[] = r.top_findings.map((f, i) => ({
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

  // Map API payer scorecard
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

  // Map API denial patterns
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

  // Build synthetic revenue chart from headline (single bar — real monthly breakdown isn't in API response)
  const totalBilled = h.total_revenue_analyzed + h.total_leakage;
  const syntheticChart = [
    {
      month: "Analyzed",
      billed: Math.round(totalBilled),
      paid: Math.round(h.total_revenue_analyzed),
      denied: Math.round(h.total_leakage * 0.6),
      leakage: Math.round(h.total_leakage),
    },
  ];

  // Build risks from top findings that have deadline urgency
  const syntheticRisks = findings
    .filter((f) => f.expectedRecovery > 0)
    .slice(0, 4)
    .map((f, i) => ({
      id: `rf-${i}`,
      severity: f.expectedRecovery > 15000 ? "critical" : f.expectedRecovery > 8000 ? "high" : "medium",
      title: f.description,
      description: f.action,
      dollarAmount: f.dollarAmount,
      deadline: null as string | null,
      action: f.action,
      category: labelFromCategory(f.category),
    }));

  // Format data range from analysis period
  const start = r.analysis_period.start
    ? new Date(r.analysis_period.start).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";
  const end = r.analysis_period.end
    ? new Date(r.analysis_period.end).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Unknown";

  return {
    isLive: true,
    practiceName: r.practice_name,
    dataRange: `${start} – ${end}`,
    metrics: {
      revenueAnalyzed: h.total_revenue_analyzed,
      totalLeakage: h.total_leakage,
      expectedRecovery: h.expected_recovery,
      leakageRatePct: h.leakage_rate_pct,
      denialRate: h.denial_rate_pct,
      denialGrade: h.denial_grade,
      benchmarkMedian: h.benchmark_denial_rate_median,
      benchmarkBest: h.benchmark_denial_rate_best,
    },
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
    },
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

  if (result) {
    const data = fromApiResult(result);
    return { ...data, isLoading: false, hasData: true };
  }

  // While the API call is in-flight, return minimal empty state (no mock numbers)
  if (isLoading) {
    return { ...emptyData(), isLoading: true, hasData: false };
  }

  // Always show rich demo data until a real 835 is uploaded.
  // Replace this with emptyData() once live customer data is flowing.
  return { ...mockData(), isLoading: false, hasData: true };
}
