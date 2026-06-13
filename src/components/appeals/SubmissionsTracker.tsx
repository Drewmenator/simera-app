"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, XCircle, AlertCircle, Trash2,
  ChevronDown, ChevronRight, TrendingUp, Award, BarChart2,
} from "lucide-react";
import {
  useAppealSubmissions,
  type AppealSubmission,
  type AppealOutcome,
} from "@/lib/use-appeal-submissions";

// ── Outcome badge ────────────────────────────────────────────────────────────

const OUTCOME_CONFIG: Record<AppealOutcome, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  pending:   { label: "Pending",   icon: Clock,         color: "#9a6a1e", bg: "#f8efdd", border: "rgba(189,133,47,0.3)" },
  won:       { label: "Won",       icon: CheckCircle2,  color: "#0c8174", bg: "#e4f4f1", border: "rgba(12,129,116,0.3)" },
  lost:      { label: "Lost",      icon: XCircle,       color: "#c2553d", bg: "#f8e8e3", border: "rgba(194,85,61,0.3)" },
  escalated: { label: "Escalated", icon: AlertCircle,   color: "#2a6f97", bg: "#e8f1f8", border: "rgba(42,111,151,0.3)" },
};

function OutcomeBadge({ status }: { status: AppealOutcome }) {
  const c = OUTCOME_CONFIG[status];
  const Icon = c.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <Icon style={{ width: 12, height: 12 }} />
      {c.label}
    </span>
  );
}

// ── Outcome picker modal ─────────────────────────────────────────────────────

function OutcomeModal({
  submission,
  onSave,
  onCancel,
}: {
  submission: AppealSubmission;
  onSave: (status: AppealOutcome, amount?: number, notes?: string) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<AppealOutcome>(
    submission.status === "pending" ? "won" : submission.status
  );
  const [amount, setAmount] = useState(
    String(submission.outcomeAmount ?? submission.expectedRecovery)
  );
  const [notes, setNotes] = useState(submission.notes ?? "");

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(11,39,52,0.45)", backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: "#fff",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 8px 40px rgba(11,39,52,0.28)",
        }}
      >
        {/* Header */}
        <div style={{ background: "#0b2734", padding: "16px 20px" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>Update Appeal Outcome</p>
          <p style={{ color: "#14b8a6", fontSize: 11.5, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {submission.payer} · {submission.denialCode ? `CARC ${submission.denialCode}` : "Dispute"}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status picker */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#5c747e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Outcome</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(["won", "lost", "pending", "escalated"] as AppealOutcome[]).map((s) => {
                const c = OUTCOME_CONFIG[s];
                const Icon = c.icon;
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                      borderRadius: 10, border: active ? `1.5px solid ${c.border}` : "1px solid rgba(11,39,52,0.12)",
                      background: active ? c.bg : "#fff", cursor: "pointer",
                      color: active ? c.color : "#5c747e", fontWeight: active ? 700 : 500, fontSize: 13,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon style={{ width: 14, height: 14 }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount (only for won) */}
          {status === "won" && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#5c747e", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                Amount Recovered ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 8,
                  border: "1px solid rgba(11,39,52,0.18)", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#5c747e", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Denial reason, reviewer name, follow-up needed…"
              style={{
                width: "100%", padding: "9px 12px", fontSize: 13, borderRadius: 8,
                border: "1px solid rgba(11,39,52,0.18)", outline: "none", resize: "vertical",
                boxSizing: "border-box", lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(11,39,52,0.14)",
              background: "#fff", color: "#5c747e", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(status, status === "won" ? Number(amount) || undefined : undefined, notes || undefined)}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "none",
              background: "#0b2734", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Save Outcome
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Analytics row ────────────────────────────────────────────────────────────

function AnalyticsSection({ byPayer, byCode, totalWon, winRate, totalRecovered }: {
  byPayer: Record<string, { won: number; total: number; recovered: number }>;
  byCode: Record<string, { won: number; total: number; recovered: number }>;
  totalWon: number;
  winRate: number | null;
  totalRecovered: number;
}) {
  const [open, setOpen] = useState(false);
  const topPayers = Object.entries(byPayer)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);
  const topCodes = Object.entries(byCode)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  return (
    <div style={{
      border: "1px solid rgba(11,39,52,0.10)", borderRadius: 14, overflow: "hidden",
      background: "#fff", boxShadow: "0 1px 4px rgba(11,39,52,0.06)",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "16px 20px", display: "flex", alignItems: "center",
          gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <BarChart2 style={{ width: 16, height: 16, color: "#14b8a6", flexShrink: 0 }} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#0b2734" }}>
          Denial Outcome Analytics
        </span>
        {winRate !== null && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#0c8174",
            background: "#e4f4f1", padding: "3px 9px", borderRadius: 20,
          }}>
            {winRate}% win rate
          </span>
        )}
        {open
          ? <ChevronDown style={{ width: 15, height: 15, color: "#8aa0a8", flexShrink: 0 }} />
          : <ChevronRight style={{ width: 15, height: 15, color: "#8aa0a8", flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(11,39,52,0.08)", padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Chip label="Appeals Won" value={String(totalWon)} color="#0c8174" bg="#e4f4f1" />
            <Chip label="Win Rate" value={winRate !== null ? `${winRate}%` : "—"} color="#0c8174" bg="#e4f4f1" />
            <Chip
              label="Total Recovered"
              value={`$${(totalRecovered / 1000).toFixed(1)}K`}
              color="#0b2734"
              bg="#f0f4f4"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* By payer */}
            {topPayers.length > 0 && (
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  By Payer
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topPayers.map(([payer, stats]) => (
                    <PayerBar key={payer} label={payer} won={stats.won} total={stats.total} />
                  ))}
                </div>
              </div>
            )}

            {/* By code */}
            {topCodes.length > 0 && (
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  By Denial Code
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topCodes.map(([code, stats]) => (
                    <PayerBar
                      key={code}
                      label={code === "other" ? "Underpayment/Dispute" : `CARC ${code}`}
                      won={stats.won}
                      total={stats.total}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {topPayers.length === 0 && (
            <p style={{ fontSize: 12.5, color: "#8aa0a8", textAlign: "center", padding: "8px 0" }}>
              Mark outcomes as Won / Lost to see analytics here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ padding: "8px 14px", borderRadius: 10, background: bg, border: `1px solid ${color}22` }}>
      <p style={{ fontSize: 9.5, color, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.2 }}>{value}</p>
    </div>
  );
}

function PayerBar({ label, won, total }: { label: string; won: number; total: number }) {
  const rate = total > 0 ? (won / total) : 0;
  const pct = Math.round(rate * 100);
  const hasResolved = won < total; // some still pending/lost
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#0b2734", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: "#5c747e", flexShrink: 0 }}>
          {won}/{total} {hasResolved ? "" : "✓"}
        </span>
      </div>
      <div style={{ height: 5, background: "#e9eded", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 60 ? "#14b8a6" : pct >= 30 ? "#bd852f" : "#c2553d", borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ fontSize: 10.5, color: "#8aa0a8", marginTop: 2 }}>{pct}% win rate</p>
    </div>
  );
}

// ── Submission row ────────────────────────────────────────────────────────────

function SubmissionRow({
  sub,
  onUpdateStatus,
  onDelete,
}: {
  sub: AppealSubmission;
  onUpdateStatus: (id: string, status: AppealOutcome, amount?: number, notes?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const submittedDate = new Date(sub.submittedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const outcomeDate = sub.outcomeDate
    ? new Date(sub.outcomeDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const daysPending = sub.status === "pending"
    ? Math.floor((Date.now() - new Date(sub.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {editing && (
        <OutcomeModal
          submission={sub}
          onSave={(status, amount, notes) => {
            onUpdateStatus(sub.id, status, amount, notes);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 90px 100px 120px 100px",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid rgba(11,39,52,0.06)",
        background: sub.status === "won" ? "rgba(20,184,166,0.02)" : sub.status === "lost" ? "rgba(194,85,61,0.02)" : "#fff",
      }}>
        {/* Payer + description */}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0b2734", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub.payer}
          </p>
          <p style={{ fontSize: 11, color: "#8aa0a8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub.denialCode ? `CARC ${sub.denialCode}` : "Dispute"} · {submittedDate}
            {daysPending !== null && daysPending > 30 && (
              <span style={{ color: "#c2553d", fontWeight: 600 }}> · {daysPending}d pending</span>
            )}
          </p>
          {sub.notes && (
            <p style={{ fontSize: 10.5, color: "#5c747e", margin: "2px 0 0", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sub.notes}
            </p>
          )}
        </div>

        {/* At risk */}
        <div>
          <p style={{ fontSize: 10, color: "#8aa0a8", margin: 0 }}>At risk</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#c2553d", margin: 0 }}>
            ${sub.dollarAmount >= 1000 ? `${(sub.dollarAmount / 1000).toFixed(0)}K` : sub.dollarAmount.toLocaleString()}
          </p>
        </div>

        {/* Recovered */}
        <div>
          <p style={{ fontSize: 10, color: "#8aa0a8", margin: 0 }}>Recovered</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: sub.status === "won" ? "#0c8174" : "#d1dde0", margin: 0 }}>
            {sub.status === "won"
              ? `$${(sub.outcomeAmount ?? sub.expectedRecovery) >= 1000
                  ? `${((sub.outcomeAmount ?? sub.expectedRecovery) / 1000).toFixed(0)}K`
                  : (sub.outcomeAmount ?? sub.expectedRecovery).toLocaleString()}`
              : "—"
            }
          </p>
          {sub.status === "won" && outcomeDate && (
            <p style={{ fontSize: 10, color: "#8aa0a8", margin: 0 }}>{outcomeDate}</p>
          )}
        </div>

        {/* Status badge */}
        <div>
          <OutcomeBadge status={sub.status} />
        </div>

        {/* Update button */}
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid rgba(11,39,52,0.14)", background: "#fff", color: "#0b2734",
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Update
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (confirm("Remove this appeal record?")) onDelete(sub.id);
          }}
          style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(194,85,61,0.2)",
            background: "rgba(194,85,61,0.04)", color: "#c2553d", display: "flex",
            alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}
        >
          <Trash2 style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SubmissionsTracker() {
  const {
    submissions, totalSubmitted, totalWon, totalRecoveredViaAppeals,
    winRate, byPayer, byCode,
    updateStatus, deleteSubmission,
  } = useAppealSubmissions();

  const pending = submissions.filter((s) => s.status === "pending");
  const resolved = submissions.filter((s) => s.status !== "pending");

  if (totalSubmitted === 0) {
    return (
      <div style={{
        border: "1px solid rgba(11,39,52,0.10)", borderRadius: 14,
        background: "#fff", padding: "32px 24px", textAlign: "center",
        boxShadow: "0 1px 4px rgba(11,39,52,0.06)",
      }}>
        <Award style={{ width: 32, height: 32, color: "#d1dde0", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0b2734", margin: "0 0 6px" }}>
          No appeal submissions tracked yet
        </p>
        <p style={{ fontSize: 13, color: "#5c747e", maxWidth: 380, margin: "0 auto", lineHeight: 1.5 }}>
          When you generate an appeal letter, click <strong>Log Submission</strong> to start tracking outcomes. Simera will calculate your win rate by payer and denial code.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Analytics */}
      <AnalyticsSection
        byPayer={byPayer}
        byCode={byCode}
        totalWon={totalWon}
        winRate={winRate}
        totalRecovered={totalRecoveredViaAppeals}
      />

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ border: "1px solid rgba(11,39,52,0.10)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(11,39,52,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock style={{ width: 14, height: 14, color: "#bd852f" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0b2734" }}>Pending ({pending.length})</span>
          </div>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 90px 100px 120px 100px",
            gap: 12, padding: "8px 16px",
            background: "#f8fafc", borderBottom: "1px solid rgba(11,39,52,0.06)",
          }}>
            {["Appeal", "At Risk", "Expected", "Status", "", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </span>
            ))}
          </div>
          {pending.map((sub) => (
            <SubmissionRow key={sub.id} sub={sub} onUpdateStatus={updateStatus} onDelete={deleteSubmission} />
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div style={{ border: "1px solid rgba(11,39,52,0.10)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(11,39,52,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp style={{ width: 14, height: 14, color: "#0c8174" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0b2734" }}>Resolved ({resolved.length})</span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 90px 100px 120px 100px",
            gap: 12, padding: "8px 16px",
            background: "#f8fafc", borderBottom: "1px solid rgba(11,39,52,0.06)",
          }}>
            {["Appeal", "At Risk", "Recovered", "Status", "", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {h}
              </span>
            ))}
          </div>
          {resolved.map((sub) => (
            <SubmissionRow key={sub.id} sub={sub} onUpdateStatus={updateStatus} onDelete={deleteSubmission} />
          ))}
        </div>
      )}
    </div>
  );
}
