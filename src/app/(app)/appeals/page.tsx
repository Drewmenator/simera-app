"use client";

import { useState } from "react";
import { useAuditContext } from "@/lib/audit-context";
import { useAuditData, type DashboardFinding } from "@/lib/use-audit-data";
import type { AuditFinding } from "@/lib/api";
import { DenialWorkQueue } from "@/components/appeals/DenialWorkQueue";
import { SubmissionsTracker } from "@/components/appeals/SubmissionsTracker";
import { RecoveryFunnel } from "@/components/appeals/RecoveryFunnel";
import { useOverdueAppeals } from "@/hooks/use-overdue-appeals";
import { Upload, AlertCircle, FileText, TrendingUp, ListChecks, Inbox, Bell } from "lucide-react";
import Link from "next/link";

function dashFindingToAuditFinding(f: DashboardFinding): AuditFinding {
  return {
    rank: f.rank,
    category: f.category,
    payer_name: f.payer,
    dollar_amount: f.dollarAmount,
    expected_recovery: f.expectedRecovery,
    recovery_probability: f.recoveryProbability,
    difficulty: f.difficulty as "easy" | "medium" | "hard",
    description: f.description,
    recommended_action: f.action,
    denial_codes: f.denialCodes,
    cpt_codes: f.cptCodes,
    claim_ids: f.claimIds ?? [],
    claim_count: f.claimIds?.length ?? 0,
    diagnosis_codes: f.diagnosisCodes,
    service_dates: f.serviceDates,
    denial_date: f.denialDate,
    payer_claim_number: f.payerClaimNumber,
    recovery_confidence: f.recoveryConfidence,
  };
}

type Tab = "queue" | "tracker";

export default function AppealsPage() {
  const [tab, setTab] = useState<Tab>("queue");
  const { result, isLoading } = useAuditContext();
  const { findings: dashFindings, practiceName: demoPracticeName } = useAuditData();
  const { overdueCount, hasOverdue } = useOverdueAppeals();

  // Use live API findings OR fall back to demo DashboardFindings
  const findings: AuditFinding[] = result?.top_findings ?? dashFindings.map(dashFindingToAuditFinding);
  const practiceName = result?.practice_name ?? demoPracticeName;

  // Summary metrics
  const denialFindings = findings.filter(f =>
    ["unworked_denial", "wrong_writeoff", "timely_filing"].includes(f.category)
  );
  const totalAtRisk = denialFindings.reduce((s, f) => s + f.dollar_amount, 0);
  const totalRecoverable = denialFindings
    .filter(f => f.category !== "timely_filing")
    .reduce((s, f) => s + f.expected_recovery, 0);
  const totalClaims = denialFindings.reduce((s, f) => s + (f.claim_count ?? f.claim_ids?.length ?? 0), 0);
  const payersAffected = new Set(denialFindings.map(f => f.payer_name).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground">Appeals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build appeal packages, generate letters, and track every submission to outcome.
          </p>
        </div>
        {(result || dashFindings.length > 0) && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">From audit</p>
            <p className="text-xs font-medium text-foreground">{practiceName}</p>
          </div>
        )}
      </div>

      {/* Overdue appeals alert */}
      {hasOverdue && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
          <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>{overdueCount} appeal{overdueCount !== 1 ? "s" : ""} pending for 30+ days</strong> with no outcome recorded.
            {" "}Follow up with payers and mark outcomes in the{" "}
            <button onClick={() => setTab("tracker")} className="underline font-semibold cursor-pointer bg-transparent border-none p-0 text-amber-800 hover:text-amber-900">
              Submissions Tracker
            </button>
            {" "}to keep your win-rate data current.
          </p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
        {([
          { id: "queue",   label: "Work Queue",          icon: Inbox },
          { id: "tracker", label: "Submissions Tracker", icon: ListChecks },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Recovery funnel — proof ledger, visible on both tabs */}
      {(result || dashFindings.length > 0) && (
        <RecoveryFunnel
          identifiedCount={denialFindings.length}
          identifiedRecoverable={totalRecoverable}
          identifiedAtRisk={totalAtRisk}
        />
      )}

      {/* ── Work Queue tab ─────────────────────────────────────────────── */}
      {tab === "queue" && (
        <>
          {/* No audit loaded */}
          {!isLoading && !result && dashFindings.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-4">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">No audit data loaded</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload an 835 ERA file to populate your denial work queue with individual appeal packages.
                </p>
              </div>
              <Link
                href="/revenue"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload 835 File
              </Link>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Audit loaded */}
          {(result || dashFindings.length > 0) && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[10px] text-rose-700 uppercase tracking-wide font-medium">Denial Exposure</p>
                  <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">
                    ${totalAtRisk >= 1000 ? `${(totalAtRisk / 1000).toFixed(0)}K` : totalAtRisk.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-rose-500 mt-0.5">denials only</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-medium">Recoverable via appeal</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                    ${totalRecoverable >= 1000 ? `${(totalRecoverable / 1000).toFixed(0)}K` : totalRecoverable.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Denial claims</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{totalClaims || "—"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Payers</p>
                  <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{payersAffected || "—"}</p>
                </div>
              </div>

              {/* Explainer */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-blue-800">Every denial is different. Every appeal needs its own evidence package.</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Click any work item below to see exactly what documentation to attach, the specific legal argument to make,
                    and a pre-filled appeal letter. Then use <strong>Log submission</strong> to track the outcome.
                  </p>
                </div>
              </div>

              {/* Work queue */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Open Work Items ({denialFindings.length})
                  </h2>
                  {denialFindings.length > 0 && (
                    <p className="text-xs text-muted-foreground">Sorted by expected recovery value</p>
                  )}
                </div>
                <DenialWorkQueue
                  findings={[...findings].sort((a, b) => b.expected_recovery - a.expected_recovery)}
                  practiceName={practiceName}
                />
              </div>

              {/* Non-denial findings notice */}
              {findings.some(f => ["underpayment", "undercoding"].includes(f.category)) && (
                <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
                  <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Underpayment & undercoding findings</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      These require a different workflow — contract analysis and coding review rather than denial appeals.
                      View them in the <Link href="/revenue" className="text-primary hover:underline">Revenue tab</Link>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Submissions Tracker tab ─────────────────────────────────────── */}
      {tab === "tracker" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Appeal Submissions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track every submitted appeal from generation to outcome. Mark Won / Lost to build your win-rate analytics.
              </p>
            </div>
          </div>
          <SubmissionsTracker />
        </div>
      )}
    </div>
  );
}
