"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";
import { useFindingStatuses, findingId, STATUS_CONFIG, FindingStatus } from "@/lib/use-finding-statuses";
import { daysUntil, deadlineLabel, deadlineColor, deadlineBg } from "@/lib/deadlines";
import { denialTaxonomy, appealOverturnRates } from "@/lib/mock-data";
import DenialRiskWidget, { DenialRiskPrediction } from "@/components/ai/denial-risk-widget";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div style={{ ...CARD, padding: "20px 22px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "#8aa0a8" }}>{label}</span>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, marginTop: 14, color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

const SEV_CONFIG = {
  critical: { rail: "#c2553d", iconBg: "#f8e8e3", iconColor: "#c2553d", tagBg: "#f8e8e3", tagColor: "#c2553d", label: "Critical" },
  high: { rail: "#bd852f", iconBg: "#f8efdd", iconColor: "#bd852f", tagBg: "#f8efdd", tagColor: "#9a6a1e", label: "High" },
  medium: { rail: "#d8a93f", iconBg: "#f8efdd", iconColor: "#bd852f", tagBg: "#f8efdd", tagColor: "#9a6a1e", label: "Medium" },
  low: { rail: "#0c8174", iconBg: "#e4f4f1", iconColor: "#0c8174", tagBg: "#e4f4f1", tagColor: "#0c8174", label: "Low" },
};

const FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical", dot: "#c2553d" },
  { id: "high", label: "High", dot: "#bd852f" },
  { id: "medium", label: "Medium", dot: "#d8a93f" },
  { id: "low", label: "Low", dot: "#0c8174" },
];

const STATUS_FILTER_CHIPS: { id: FindingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "appealed", label: "Appealed" },
  { id: "resolved", label: "Resolved" },
  { id: "ignored", label: "Ignored" },
];

const STATUS_ORDER: FindingStatus[] = ["open", "in_progress", "appealed", "resolved", "ignored"];

export default function RisksPage() {
  const { risks, metrics } = useAuditData();
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "all">("all");
  const { getStatus, setStatus } = useFindingStatuses();

  const totalAtRisk = risks.reduce((s, r) => s + r.dollarAmount, 0);
  const critCount = risks.filter((r) => r.severity === "critical").length;
  const highCount = risks.filter((r) => r.severity === "high").length;
  const medCount = risks.filter((r) => r.severity === "medium").length;

  const getCount = (f: string) => f === "all" ? risks.length : risks.filter((r) => r.severity === f).length;

  const getStatusCount = (s: FindingStatus | "all") => {
    if (s === "all") return risks.length;
    return risks.filter((r) => getStatus(findingId(r.title, r.category)) === s).length;
  };

  const severityFiltered = filter === "all" ? risks : risks.filter((r) => r.severity === filter);
  const filtered = statusFilter === "all"
    ? severityFiltered
    : severityFiltered.filter((r) => getStatus(findingId(r.title, r.category)) === statusFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] md:gap-[18px]">
        <KpiCard label="Total at Risk" value={fmt(totalAtRisk)} accent="#c2553d" />
        <KpiCard label="Critical" value={critCount} accent="#c2553d" />
        <KpiCard label="High" value={highCount} accent="#bd852f" />
        <KpiCard label="Medium" value={medCount} accent="#d8a93f" />
      </div>

      {/* Denial Taxonomy + Appeal Overturn Rates */}
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-[14px] md:gap-[18px]">

        {/* Denial taxonomy */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 3px" }}>Denial Taxonomy</h2>
            <p style={{ fontSize: 12.5, color: "#5c747e" }}>Industry-wide breakdown — what&apos;s driving denials and recovery rates · MGMA / HFMA 2024</p>
          </div>
          {denialTaxonomy.map((row) => (
            <div key={row.category} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
              {/* Bar + label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0b2734" }}>{row.category}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: `${row.color}14`, color: row.color }}>
                    {row.pctOfDenials}% of denials
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(11,39,52,0.07)", overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${row.pctOfDenials * 3.3}%`, background: row.color, borderRadius: 4, opacity: 0.75 }} />
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "#5c747e" }}>
                    <span style={{ color: "#8aa0a8" }}>CARCs: </span>
                    {row.topCARCs.map((c) => (
                      <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, background: "#f6f8f8", padding: "1px 5px", borderRadius: 4, marginRight: 4 }}>{c}</span>
                    ))}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#5c747e" }}>
                    <span style={{ color: "#8aa0a8" }}>Prevention: </span>{row.prevention}
                  </span>
                </div>
              </div>
              {/* Recovery rate */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: row.recoveryRate > 60 ? "#0c8174" : row.recoveryRate < 15 ? "#c2553d" : "#bd852f", fontVariantNumeric: "tabular-nums" }}>
                  {row.recoveryRate}%
                </div>
                <div style={{ fontSize: 10.5, color: "#8aa0a8", whiteSpace: "nowrap" }}>recovery</div>
              </div>
            </div>
          ))}
        </div>

        {/* Appeal overturn rates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...CARD, padding: "20px 22px" }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: "0 0 3px" }}>Appeal Overturn Rates</h3>
              <p style={{ fontSize: 12, color: "#5c747e" }}>Most denials are never appealed — but most win when they are</p>
            </div>
            {appealOverturnRates.map((row) => (
              <div key={row.payer} style={{ padding: "10px 0", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0b2734" }}>{row.payer}</div>
                    {row.note && <div style={{ fontSize: 11.5, color: "#c2553d", fontWeight: 600, marginTop: 2 }}>{row.note}</div>}
                    <div style={{ fontSize: 11.5, color: "#8aa0a8", marginTop: 1 }}>Appeal rate: {row.appealRate}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: row.overturnRate >= 70 ? "#0c8174" : "#bd852f", fontVariantNumeric: "tabular-nums" }}>
                      {row.overturnRate}%
                    </div>
                    <div style={{ fontSize: 10.5, color: "#8aa0a8" }}>overturned</div>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: "rgba(11,39,52,0.07)", marginTop: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${row.overturnRate}%`, background: row.overturnRate >= 70 ? "#0c8174" : "#bd852f", borderRadius: 4 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 10, background: "#e4f4f1", border: "1px solid rgba(12,129,116,0.2)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <TrendingUp style={{ width: 15, height: 15, color: "#0c8174", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12.5, color: "#0c8174", lineHeight: 1.45 }}>
                  <b>Key paradox:</b> appeal success rates are high, but 35–60% of denials are never resubmitted. Every appealed MA denial wins 4 out of 5 times.
                </p>
              </div>
            </div>
          </div>

          {/* Cost to rework card */}
          <div style={{ ...CARD, padding: "20px 22px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: "0 0 14px" }}>Denial Cost Intelligence</h3>
            {[
              { label: "Avg cost to rework one claim", value: "$57.23", sub: "Up 30% from $43.84 in 2022", accent: "#c2553d" },
              { label: "Denials never resubmitted", value: "35–60%", sub: "Pure revenue abandoned", accent: "#bd852f" },
              { label: "Annual denial losses (industry)", value: "$262B", sub: "$25.7B spent contesting them", accent: "#0b2734" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(11,39,52,0.06)", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0b2734" }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: "#8aa0a8", marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.accent, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Denial Risk Widget — highest-risk claim from current audit */}
      {(() => {
        const topRisk = risks.find((r) => r.severity === "critical") ?? risks[0];
        if (!topRisk) return null;

        const prediction: DenialRiskPrediction = {
          claimId: topRisk.id ?? "DEMO-001",
          denialRiskScore: topRisk.severity === "critical" ? 0.87 :
                           topRisk.severity === "high" ? 0.62 :
                           topRisk.severity === "medium" ? 0.38 : 0.15,
          riskLevel: topRisk.severity as "critical" | "high" | "medium" | "low",
          confidenceTier: topRisk.severity === "critical" ? "review_required" :
                          topRisk.severity === "high" ? "review_recommended" : "auto",
          topReasons: (topRisk.description ? [{
            code: topRisk.category?.toLowerCase().replace(/\s+/g, "_") ?? "unknown",
            description: topRisk.description,
            category: topRisk.category ?? "General",
            probabilityContribution: topRisk.severity === "critical" ? 0.45 : 0.28,
          }] : []),
          shapFactors: [
            { factor: "base_rate", label: "Industry Baseline", contribution: 0.08 },
            { factor: topRisk.category?.toLowerCase().replace(/\s+/g, "_") ?? "claim_issue",
              label: topRisk.category ?? "Claim Issue",
              contribution: topRisk.severity === "critical" ? 0.45 :
                            topRisk.severity === "high" ? 0.30 : 0.15 },
            { factor: "payer_pattern", label: "Payer Pattern", contribution: 0.07 },
          ],
          recommendedActions: topRisk.action ? [topRisk.action] : ["Review claim before submission."],
          modelVersion: "heuristic-v1.2.0",
        };

        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: 0 }}>AI Risk Assessment</h2>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0c8174", background: "#e4f4f1", borderRadius: 999, padding: "2px 8px" }}>
                Highest-Priority Claim
              </span>
            </div>
            <div style={{
              background: "#0a1628",
              borderRadius: 16,
              padding: 2,
              boxShadow: "0 2px 12px rgba(11,39,52,0.15)",
            }}>
              <DenialRiskWidget prediction={prediction} />
            </div>
          </div>
        );
      })()}

      {/* Severity filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTER_CHIPS.map((chip) => {
          const active = filter === chip.id;
          const count = getCount(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${active ? "#0b2734" : "rgba(11,39,52,0.10)"}`,
                background: active ? "#0b2734" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: active ? "#fff" : "#5c747e",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
              }}
            >
              {chip.dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: chip.dot, display: "inline-block" }} />}
              {chip.label}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Status filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_FILTER_CHIPS.map((chip) => {
          const active = statusFilter === chip.id;
          const count = getStatusCount(chip.id);
          const cfg = chip.id !== "all" ? STATUS_CONFIG[chip.id as FindingStatus] : null;
          return (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id as FindingStatus | "all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${active && cfg ? cfg.border : active ? "#0b2734" : "rgba(11,39,52,0.10)"}`,
                background: active && cfg ? cfg.bg : active ? "#0b2734" : "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: active && cfg ? cfg.color : active ? "#fff" : "#5c747e",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
              }}
            >
              {chip.label}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Risk cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((risk) => {
          const sev = SEV_CONFIG[risk.severity as keyof typeof SEV_CONFIG] ?? SEV_CONFIG.medium;
          const daysLeft = daysUntil(risk.deadline ?? null);
          const fid = findingId(risk.title, risk.category);
          const currentStatus = getStatus(fid);

          return (
            <div
              key={risk.id}
              style={{
                background: "#fff",
                border: "1px solid rgba(11,39,52,0.10)",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Left rail */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: sev.rail }} />

              {/* Top */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: sev.iconBg, color: sev.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 18, height: 18 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: 0 }}>{risk.title}</h3>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: sev.tagBg, color: sev.tagColor }}>
                      {sev.label}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.10)", color: "#5c747e" }}>
                      {risk.category}
                    </span>
                    {currentStatus !== "open" && (
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: STATUS_CONFIG[currentStatus].bg,
                        border: `1px solid ${STATUS_CONFIG[currentStatus].border}`,
                        color: STATUS_CONFIG[currentStatus].color,
                      }}>
                        {STATUS_CONFIG[currentStatus].label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <p style={{ fontSize: 13.5, color: "#5c747e", lineHeight: 1.55, margin: "12px 0 16px" }}>{risk.description}</p>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, color: "#5c747e" }}>
                  At risk: <b style={{ color: "#0b2734", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(risk.dollarAmount)}</b>
                </span>
                {daysLeft !== null && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: deadlineBg(daysLeft),
                    color: deadlineColor(daysLeft),
                  }}>
                    <Clock style={{ width: 13, height: 13 }} />
                    {daysLeft < 0 ? "⚠ Overdue" : deadlineLabel(daysLeft)}
                  </span>
                )}
                <button
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0c8174",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {risk.action} <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Status row */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(11,39,52,0.07)", flexWrap: "wrap" }}>
                {STATUS_ORDER.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const isActive = currentStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(fid, s)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: 26,
                        padding: "0 10px",
                        borderRadius: 999,
                        border: `1px solid ${isActive ? cfg.border : "rgba(11,39,52,0.08)"}`,
                        background: isActive ? cfg.bg : "transparent",
                        fontSize: 11.5,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? cfg.color : "#9aabb0",
                        cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#8aa0a8", padding: "48px 0", fontSize: 14 }}>
            No {filter} risks.
          </p>
        )}
      </div>
    </div>
  );
}
