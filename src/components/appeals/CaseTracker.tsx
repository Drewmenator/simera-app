"use client";

/**
 * CaseTracker — the persisted denial work queue (Phase 1 spine).
 *
 * Renders live cases from /cases, sorted by deadline / recoverable dollars, and
 * lets the user advance each case through the recovery lifecycle (writes to
 * POST /cases/{id}/status). Expanding a case loads its status-change timeline.
 *
 * Empty in pure demo mode — cases exist only after an 835 audit is persisted.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Inbox, ChevronDown, ChevronRight, Clock, AlertTriangle,
  RefreshCw, CheckCircle2, FileText,
} from "lucide-react";
import {
  useCases, fetchCaseDetail, CASE_STATUSES, STATUS_META,
  type DenialCase, type CaseStatus, type CaseSort, type CaseTimelineEntry,
} from "@/lib/use-cases";

function money(n: number | null | undefined): string {
  if (!n || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const days = daysUntil(deadline);
  if (days === null) return <span className="text-xs text-muted-foreground">No deadline</span>;
  const urgent = days <= 14;
  const past = days < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        past ? "text-red-600" : urgent ? "text-amber-600" : "text-muted-foreground"
      }`}
    >
      {urgent || past ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {past ? `${Math.abs(days)}d overdue` : `${days}d left`}
    </span>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function Timeline({ caseId }: { caseId: string }) {
  const [entries, setEntries] = useState<CaseTimelineEntry[] | null>(null);
  useEffect(() => {
    let active = true;
    fetchCaseDetail(caseId).then((d) => {
      if (active) setEntries(d?.timeline ?? []);
    });
    return () => {
      active = false;
    };
  }, [caseId]);

  if (entries === null) return <p className="text-xs text-muted-foreground">Loading history…</p>;
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No status changes yet.</p>;
  return (
    <ol className="space-y-1.5">
      {entries.map((e, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
          <span className="font-medium text-foreground">
            {STATUS_META[e.new_status as CaseStatus]?.label ?? e.new_status}
          </span>
          {e.old_status && <span>← {STATUS_META[e.old_status as CaseStatus]?.label ?? e.old_status}</span>}
          {e.recovered_amount != null && <span className="text-emerald-600">+{money(e.recovered_amount)}</span>}
          <span className="ml-auto">{new Date(e.changed_at).toLocaleDateString()}</span>
        </li>
      ))}
    </ol>
  );
}

function CaseRow({
  c,
  onAdvance,
}: {
  c: DenialCase;
  onAdvance: (id: string, status: CaseStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const advance = async (status: CaseStatus) => {
    setSaving(true);
    await onAdvance(c.id, status);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={open ? "Collapse" : "Expand"}
        >
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">
              {c.payer_name ?? "Unknown payer"}
            </span>
            {c.denial_reason_code && (
              <span className="text-xs text-muted-foreground">CARC {c.denial_reason_code}</span>
            )}
            {c.denial_category && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">
                {c.denial_category.replace("_", " ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{money(c.expected_recovery)}</span> recoverable
              {c.dollar_amount ? ` of ${money(c.dollar_amount)}` : ""}
            </span>
            <DeadlineBadge deadline={c.timely_filing_deadline} />
            {c.recoverability_score != null && (
              <span className="text-xs text-muted-foreground">
                {Math.round(c.recoverability_score * 100)}% likely
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={c.status} />
        <select
          value={c.status}
          disabled={saving}
          onChange={(e) => advance(e.target.value as CaseStatus)}
          className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground cursor-pointer disabled:opacity-50"
          aria-label="Advance case status"
        >
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {open && (
        <div className="border-t border-border p-3 space-y-3 bg-secondary/30">
          {c.description && <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {c.claim_id && (
              <div><span className="text-muted-foreground">Claim: </span><span className="text-foreground font-medium">{c.claim_id}</span></div>
            )}
            {c.submission_method && c.submission_method !== "none" && (
              <div><span className="text-muted-foreground">Submitted via: </span><span className="text-foreground font-medium">{c.submission_method}</span></div>
            )}
            {c.recovered_amount != null && (
              <div><span className="text-muted-foreground">Recovered: </span><span className="text-emerald-600 font-medium">{money(c.recovered_amount)}</span></div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-1.5">History</p>
            <Timeline caseId={c.id} />
          </div>
        </div>
      )}
    </div>
  );
}

export function CaseTracker() {
  const [sort, setSort] = useState<CaseSort>("deadline");
  const { cases, isLoading, error, refresh, updateStatus } = useCases({ sort });

  const onAdvance = useCallback(
    async (id: string, status: CaseStatus) => {
      const ok = await updateStatus(id, { status });
      if (!ok) await refresh(); // fall back to server truth on failure
    },
    [updateStatus, refresh]
  );

  const totalRecoverable = cases.reduce((s, c) => s + (c.expected_recovery ?? 0), 0);
  const totalRecovered = cases.reduce((s, c) => s + (c.recovered_amount ?? 0), 0);
  const openCount = cases.filter((c) => STATUS_META[c.status]?.phase !== "resolved").length;

  const sorts: { id: CaseSort; label: string }[] = [
    { id: "deadline", label: "Deadline" },
    { id: "dollars", label: "Recoverable $" },
    { id: "recoverability", label: "Likelihood" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary + controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground"><span className="font-semibold text-foreground">{openCount}</span> open</span>
          <span className="text-muted-foreground"><span className="font-semibold text-foreground">{money(totalRecoverable)}</span> recoverable</span>
          {totalRecovered > 0 && (
            <span className="text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">{money(totalRecovered)}</span> recovered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-0.5 bg-secondary rounded-lg">
            {sorts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sort === s.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refresh()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* List / states */}
      {isLoading && cases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <RefreshCw className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground mt-2">Loading cases…</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="text-sm font-semibold text-foreground">No persisted cases yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Cases are created from your denials when an 835 audit is run and saved. Each becomes a
              trackable case you can move through the recovery lifecycle here.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" /> Run an audit to populate this queue.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <CaseRow key={c.id} c={c} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </div>
  );
}
