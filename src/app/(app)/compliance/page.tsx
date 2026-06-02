"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCompliance, type ComplianceTask, type BreachAlert } from "@/lib/use-compliance";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow:
    "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "#8aa0a8",
};

// ─── Severity config ─────────────────────────────────────────────────────────

const SEV_CONFIG = {
  critical: { dot: "#c2553d", bg: "#f8e8e3", color: "#c2553d", label: "Critical" },
  high:     { dot: "#bd852f", bg: "#f8efdd", color: "#bd852f", label: "High"     },
  medium:   { dot: "#0c8174", bg: "#e4f4f1", color: "#0c8174", label: "Medium"   },
  low:      { dot: "#8aa0a8", bg: "#f6f8f8", color: "#5c747e", label: "Low"      },
};

const STATUS_CONFIG = {
  pending:     { bg: "#f6f8f8", border: "rgba(11,39,52,0.10)", color: "#5c747e",  label: "Pending",     italic: false },
  in_progress: { bg: "#f8efdd", border: "rgba(189,133,47,0.35)", color: "#9a6a1e", label: "In Progress", italic: false },
  done:        { bg: "#e4f4f1", border: "rgba(12,129,116,0.35)", color: "#0c8174", label: "Done",        italic: false },
  blocked:     { bg: "#f8e8e3", border: "rgba(194,85,61,0.35)", color: "#c2553d",  label: "Blocked",     italic: false },
  waived:      { bg: "#f6f8f8", border: "rgba(11,39,52,0.10)", color: "#8aa0a8",  label: "Waived",      italic: true  },
};

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ElementType;
}) {
  const iconBg =
    accent === "#c2553d"
      ? "#f8e8e3"
      : accent === "#0c8174"
      ? "#e4f4f1"
      : accent === "#bd852f"
      ? "#f8efdd"
      : "#e9eded";
  return (
    <div style={{ ...CARD, padding: "20px 22px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={MONO}>{label}</span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: iconBg,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: 15, height: 15 }} />
        </div>
      </div>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          marginTop: 14,
          color: accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "#5c747e", marginTop: 7 }}>{sub}</div>
    </div>
  );
}

// ─── Progress donut ───────────────────────────────────────────────────────────

function ProgressDonut({ pct }: { pct: number }) {
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={78}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill="#0c8174" />
            <Cell fill="rgba(11,39,52,0.07)" />
          </Pie>
          <Tooltip formatter={(v) => [`${v}%`]} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#0b2734",
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </span>
        <span style={{ ...MONO, marginTop: 4 }}>Complete</span>
      </div>
    </div>
  );
}

// ─── Severity badge ───────────────────────────────────────────────────────────

function SevBadge({ sev }: { sev: ComplianceTask["severity"] }) {
  const cfg = SEV_CONFIG[sev] ?? SEV_CONFIG.low;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10.5,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ComplianceTask["status"] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10.5,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontStyle: cfg.italic ? "italic" : "normal",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Task row (with expandable detail) ───────────────────────────────────────

function TaskRow({
  task,
  onUpdated,
}: {
  task: ComplianceTask;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [evidence, setEvidence] = useState(task.evidence ?? "");
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);

  async function markDone() {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/compliance/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (res.ok) {
        setStatus("done");
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <div
      style={{
        border: "1px solid rgba(11,39,52,0.10)",
        borderRadius: 14,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
      }}
    >
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <SevBadge sev={task.severity} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {task.requirement}
          </div>
          <div style={{ fontSize: 12, color: "#5c747e", marginTop: 2 }}>
            {task.owner} · Due {task.due_date}
          </div>
        </div>
        <StatusBadge status={status} />
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            color: "#8aa0a8",
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* Expanded body */}
      {open && (
        <div
          style={{
            padding: "0 18px 18px 18px",
            borderTop: "1px solid rgba(11,39,52,0.07)",
          }}
        >
          <p style={{ fontSize: 13.5, color: "#5c747e", lineHeight: 1.6, marginTop: 14, marginBottom: 14 }}>
            {task.description}
          </p>

          {/* Status selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={MONO}>Status</span>
            {(Object.keys(STATUS_CONFIG) as ComplianceTask["status"][]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    height: 28,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: `1px solid ${active ? cfg.border : "rgba(11,39,52,0.10)"}`,
                    background: active ? cfg.bg : "#fff",
                    color: active ? cfg.color : "#8aa0a8",
                    fontSize: 12.5,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    fontStyle: cfg.italic ? "italic" : "normal",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Evidence field */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ ...MONO, marginBottom: 6 }}>Evidence / Notes</p>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Paste link, describe evidence, or add notes…"
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(11,39,52,0.14)",
                fontSize: 13,
                color: "#0b2734",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
                background: "#fafbfb",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {status !== "done" && (
              <button
                onClick={markDone}
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: saving ? "#b2d8d3" : "#0c8174",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} />
                {saving ? "Saving…" : "Mark Done"}
              </button>
            )}
            {status === "done" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "#0c8174",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} /> Completed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Breach alert row ─────────────────────────────────────────────────────────

function BreachRow({ alert }: { alert: BreachAlert }) {
  const cfg = SEV_CONFIG[alert.severity] ?? SEV_CONFIG.low;
  const date = new Date(alert.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid rgba(11,39,52,0.07)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0b2734" }}>{alert.type}</div>
        <div style={{ fontSize: 11.5, color: "#8aa0a8", marginTop: 1 }}>{date}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10.5,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: 999,
            background: cfg.bg,
            color: cfg.color,
          }}
        >
          {cfg.label}
        </span>
        <div style={{ fontSize: 11, color: "#8aa0a8", marginTop: 3 }}>{alert.event_count} events</div>
      </div>
    </div>
  );
}

// ─── PHASE TABS ───────────────────────────────────────────────────────────────

const PHASE_TABS = [
  { id: "all",     label: "All"      },
  { id: "0",       label: "Phase 0"  },
  { id: "1",       label: "Phase 1"  },
  { id: "2",       label: "Phase 2"  },
  { id: "3",       label: "Phase 3"  },
  { id: "ongoing", label: "Ongoing"  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [phase, setPhase] = useState("all");
  const { kpis, tasks, breachAlerts, loading, error, refetch } = useCompliance(
    phase === "all" ? undefined : phase
  );
  const [scanning, setScanning] = useState(false);

  const donePct =
    kpis && kpis.tasks_total > 0
      ? Math.round((kpis.tasks_done / kpis.tasks_total) * 100)
      : 0;

  async function runScan() {
    setScanning(true);
    try {
      await fetch(`${BASE}/admin/compliance/breach-scan`, { method: "POST" });
      refetch();
    } finally {
      setScanning(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#0b2734", margin: 0 }}>
          Compliance
        </h1>
        <p style={{ fontSize: 13, color: "#5c747e", marginTop: 4 }}>
          HIPAA compliance task tracking, breach detection, and BAA management
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] md:gap-[18px]">
        <KpiCard
          label="Tasks Completed"
          value={kpis ? `${kpis.tasks_done} / ${kpis.tasks_total}` : "— / —"}
          sub="of total compliance tasks"
          accent="#0c8174"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Critical Open"
          value={kpis ? String(kpis.critical_open) : "—"}
          sub="critical or blocked tasks"
          accent="#c2553d"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Open Breach Alerts"
          value={kpis ? String(kpis.open_breach_alerts) : "—"}
          sub="active breach signals"
          accent="#bd852f"
          icon={ShieldAlert}
        />
        <KpiCard
          label="BAA Count"
          value={kpis ? String(kpis.baa_count) : "—"}
          sub="executed agreements"
          accent="#0b2734"
          icon={FileText}
        />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-[14px] md:gap-[18px]" style={{ alignItems: "start" }}>

        {/* LEFT — Task list */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid rgba(11,39,52,0.10)", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {PHASE_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPhase(t.id)}
                  style={{
                    padding: "11px 14px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: phase === t.id ? "#0b2734" : "#5c747e",
                    borderBottom: phase === t.id ? "2px solid #14b8a6" : "2px solid transparent",
                    marginBottom: -1,
                    background: "none",
                    border: "none",
                    borderBottomWidth: 2,
                    borderBottomStyle: "solid",
                    borderBottomColor: phase === t.id ? "#14b8a6" : "transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#8aa0a8", fontSize: 13 }}>
              Loading tasks…
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "#f8e8e3",
                border: "1px solid rgba(194,85,61,0.2)",
                color: "#c2553d",
                fontSize: 13,
              }}
            >
              {error} — API may not be running. Showing empty state.
            </div>
          )}

          {!loading && !error && tasks.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#8aa0a8", fontSize: 13 }}>
              No tasks found for this filter.
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onUpdated={refetch} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Progress ring card */}
          <div style={{ ...CARD, padding: "22px 24px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: "0 0 4px" }}>
              Overall Progress
            </h2>
            <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 16 }}>
              {kpis ? `${kpis.tasks_done} of ${kpis.tasks_total} tasks completed` : "Loading…"}
            </p>
            <ProgressDonut pct={donePct} />
            {kpis && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {[
                  { label: "Done",        value: kpis.tasks_done,                            color: "#0c8174" },
                  { label: "Remaining",   value: kpis.tasks_total - kpis.tasks_done,          color: "#8aa0a8" },
                  { label: "Critical",    value: kpis.critical_open,                          color: "#c2553d" },
                  { label: "BAAs",        value: kpis.baa_count,                              color: "#0b2734" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#f6f8f8",
                      border: "1px solid rgba(11,39,52,0.07)",
                    }}
                  >
                    <div style={MONO}>{item.label}</div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: item.color,
                        fontVariantNumeric: "tabular-nums",
                        marginTop: 4,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breach detection panel */}
          <div style={{ ...CARD, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: 0 }}>
                Breach Detection
              </h2>
              <button
                onClick={runScan}
                disabled={scanning}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 30,
                  padding: "0 13px",
                  borderRadius: 8,
                  border: "1px solid rgba(11,39,52,0.14)",
                  background: "#fff",
                  color: scanning ? "#8aa0a8" : "#0b2734",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: scanning ? "not-allowed" : "pointer",
                }}
              >
                <RefreshCw
                  style={{
                    width: 12,
                    height: 12,
                    animation: scanning ? "spin 1s linear infinite" : "none",
                  }}
                />
                {scanning ? "Scanning…" : "Run Scan"}
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 16 }}>
              Active alerts from automated monitoring
            </p>

            {loading && (
              <div style={{ fontSize: 13, color: "#8aa0a8", padding: "16px 0" }}>Loading alerts…</div>
            )}

            {!loading && breachAlerts.length === 0 && (
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: 10,
                  background: "#e4f4f1",
                  border: "1px solid rgba(12,129,116,0.2)",
                  color: "#0c8174",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                No open breach alerts detected.
              </div>
            )}

            {!loading && breachAlerts.length > 0 && (
              <div>
                {breachAlerts.map((alert) => (
                  <BreachRow key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Roadmap */}
      <div style={{ ...CARD, padding: "22px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Compliance Roadmap</h2>
          <p style={{ fontSize: 13, color: "#5c747e" }}>
            HIPAA/HITECH · FCA · OIG · CMS-0057-F requirements for AI-assisted RCM — sourced from 2024–2025 regulatory guidance
          </p>
        </div>

        {[
          {
            phase: "Immediate",
            label: "Pre-Launch / Within 6 Months",
            color: "#c2553d",
            bg: "#f8e8e3",
            items: [
              { text: "Execute BAAs with all cloud infrastructure vendors (AWS/Azure/GCP) — AI model training prohibition clause required", done: false },
              { text: "TLS 1.2+ encryption in transit · AES-256 encryption at rest", done: false },
              { text: "MFA for all employee and customer-facing system access — mandatory under 2025 HIPAA Security Rule update", done: false },
              { text: "Inference-level audit logs for all AI suggestions — captures prompt content, response, and accept/reject decision", done: false },
              { text: "Role-based access controls enforcing minimum necessary standard per 45 CFR § 164.502(b)", done: false },
              { text: "Designate Privacy Officer and Security Officer", done: false },
              { text: "HIPAA Security Risk Assessment (documented, required)", done: false },
              { text: "Confidence scores + clinical documentation support displayed with all AI coding suggestions (FCA compliance)", done: false },
              { text: "Hard-stop workflow: AI-generated claims require human review sign-off before submission", done: false },
              { text: "6-year retention policy for audit logs and PHI-related records", done: false },
            ],
          },
          {
            phase: "Near-Term",
            label: "6–18 Months Post-Funding",
            color: "#bd852f",
            bg: "#f8efdd",
            items: [
              { text: "Initiate SOC 2 Type II audit readiness — engage qualified auditor", done: false },
              { text: "Annual penetration testing + semi-annual vulnerability scans (mandatory under 2025 Security Rule)", done: false },
              { text: "AI-specific audit reporting: per-claim accept/reject rates, coder override tracking, denial pattern anomaly detection", done: false },
              { text: "Periodic internal audits comparing AI-generated codes to manual sample (OIG compliance requirement)", done: false },
              { text: "Establish incident response plan with tabletop exercise", done: false },
              { text: "BAA tracking register — audit annually", done: false },
              { text: "HITRUST self-assessment (required by athenahealth Marketplace within 90 days of going GA)", done: false },
            ],
          },
          {
            phase: "Growth",
            label: "18–36 Months",
            color: "#0c8174",
            bg: "#e4f4f1",
            items: [
              { text: "Achieve SOC 2 Type II certification", done: false },
              { text: "Initiate HITRUST i1 assessment as enterprise pipeline develops", done: false },
              { text: "Commission third-party bias audit of AI models — disparate impact analysis across protected class proxies (CMS-4201-F requirement)", done: false },
              { text: "Formal AI governance policy: model versioning, performance drift monitoring, human override protocols", done: false },
              { text: "FHIR-native Prior Authorization API integrations — payers required to expose by January 1, 2027 under CMS-0057-F", done: false },
              { text: "Evaluate FDA SaMD implications if any feature touches clinical decision support (not just billing/admin)", done: false },
            ],
          },
        ].map((phase) => (
          <div key={phase.phase} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: phase.bg, color: phase.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {phase.phase}
              </span>
              <span style={{ fontSize: 13, color: "#5c747e", fontWeight: 500 }}>{phase.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {phase.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#f9fbfb", border: "1px solid rgba(11,39,52,0.07)" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 5, border: `2px solid ${phase.color}`, flexShrink: 0, marginTop: 1, background: item.done ? phase.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.done && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: "#0b2734", lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.08)", marginTop: 4 }}>
          <p style={{ fontSize: 12, color: "#8aa0a8", lineHeight: 1.55 }}>
            Sources: HIPAA Security Rule 2025 Update · OIG General Compliance Program Guidance (2024) · CMS-4201-F Medicare Advantage Rule ·
            CMS-0057-F Interoperability and Prior Authorization Final Rule · FTC AI Accountability Guidance · HHS HIPAA Civil Monetary Penalties (Aug 2024)
          </p>
        </div>
      </div>

      {/* Spin keyframe (inline style injection) */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
