"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";
import { useFindingStatuses, findingId, STATUS_CONFIG, FindingStatus } from "@/lib/use-finding-statuses";
import { daysUntil, deadlineLabel, deadlineColor, deadlineBg } from "@/lib/deadlines";

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        <KpiCard label="Total at Risk" value={fmt(totalAtRisk)} accent="#c2553d" />
        <KpiCard label="Critical" value={critCount} accent="#c2553d" />
        <KpiCard label="High" value={highCount} accent="#bd852f" />
        <KpiCard label="Medium" value={medCount} accent="#d8a93f" />
      </div>

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
