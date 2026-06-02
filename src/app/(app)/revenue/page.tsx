"use client";

import { useState, useRef } from "react";
import { ChevronDown, TrendingUp, Zap, ShieldAlert, DollarSign, FileText, CheckCircle2 } from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";
import { useFindingStatuses, findingId, STATUS_CONFIG, type FindingStatus } from "@/lib/use-finding-statuses";
import { AppealLetterModal } from "@/components/appeal/appeal-letter-modal";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine, Cell,
} from "recharts";

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

function KpiCard({ label, value, sub, accent, icon: Icon }: { label: string; value: string; sub: string; accent: string; icon: React.ElementType }) {
  const iconBg = accent === "#c2553d" ? "#f8e8e3" : accent === "#0c8174" ? "#e4f4f1" : accent === "#bd852f" ? "#f8efdd" : "#e9eded";
  return (
    <div style={{ ...CARD, padding: "20px 22px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", color: "#8aa0a8" }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: iconBg, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 15, height: 15 }} />
        </div>
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, marginTop: 14, color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "#5c747e", marginTop: 7 }}>{sub}</div>
    </div>
  );
}

function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(11,39,52,0.10)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(11,39,52,0.12)", fontSize: 13 }}>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "#8aa0a8", textTransform: "uppercase", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#c2553d", fontWeight: 700 }}>{fmt(payload[0].value)}</p>
    </div>
  );
}

const STATUS_FILTERS: { id: FindingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "appealed", label: "Appealed" },
  { id: "resolved", label: "Resolved" },
  { id: "ignored", label: "Ignored" },
];

export default function RevenuePage() {
  const { metrics, findings, payerScorecard, revenueByMonth, practiceName, isLoading, hasData } = useAuditData();
  const [activeTab, setActiveTab] = useState("leakage");
  const [openFinding, setOpenFinding] = useState<number | null>(0);
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "all">("all");
  const { getStatus, setStatus, getRecoveredAmount } = useFindingStatuses();
  const [recoveryInputs, setRecoveryInputs] = useState<Record<string, string>>({});
  const [appealFinding, setAppealFinding] = useState<{
    label: string;
    payer: string;
    denialCodes: string[];
    dollarAmount: number;
    expectedRecovery: number;
    description: string;
    action: string;
    cptCodes: string[];
  } | null>(null);

  const leakageTrend = revenueByMonth.map((m) => ({ month: m.month, leakage: m.leakage }));

  const payerBars = payerScorecard.map((p) => ({
    payer: p.payer.replace("United Healthcare", "UHC"),
    rate: p.denialRate,
    color: p.denialRate > 15 ? "#c2553d" : p.denialRate > 10 ? "#bd852f" : "#14b8a6",
  })).sort((a, b) => b.rate - a.rate);

  const tabs = [
    { id: "leakage", label: "Leakage Findings" },
    { id: "denial", label: "Denial Patterns" },
    { id: "payer", label: "Payer Scorecard" },
    { id: "cpt", label: "CPT Analysis" },
  ];

  const allFindings = findings;
  const displayFindings = statusFilter === "all"
    ? allFindings
    : allFindings.filter((f) => getStatus(findingId(f.label, f.payer)) === statusFilter);

  const statusCounts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s.id as FindingStatus] = allFindings.filter(
      (f) => getStatus(findingId(f.label, f.payer)) === s.id
    ).length;
    return acc;
  }, {} as Record<FindingStatus, number>);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] md:gap-[18px]">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(11,39,52,0.10)", borderRadius: 16, padding: "20px 22px", height: 100 }}>
              <div style={{ height: 10, width: "55%", background: "#e9eded", borderRadius: 6, marginBottom: 14 }} />
              <div style={{ height: 32, width: "75%", background: "#f0f4f4", borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(11,39,52,0.10)", borderRadius: 16, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8aa0a8" }}>Loading findings…</span>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 480, gap: 20, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "#f8e8e3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp style={{ width: 30, height: 30, color: "#c2553d" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0b2734", letterSpacing: "-0.03em", marginBottom: 8 }}>
            No findings yet
          </h2>
          <p style={{ fontSize: 14, color: "#5c747e", maxWidth: 360, lineHeight: 1.6 }}>
            Upload an 835 ERA file to analyze your revenue leakage and denial patterns.
          </p>
        </div>
        <a
          href="/onboarding"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 24px", borderRadius: 12, background: "#0b2734", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
        >
          Upload 835 File
          <FileText style={{ width: 15, height: 15 }} />
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] md:gap-[18px]">
        <KpiCard label="Total Leakage" value={fmt(metrics.totalLeakage)} sub={`${metrics.leakageRatePct.toFixed(1)}% of revenue`} accent="#c2553d" icon={TrendingUp} />
        <KpiCard label="Expected Recovery" value={fmt(metrics.expectedRecovery)} sub="Probability-weighted" accent="#0c8174" icon={Zap} />
        <KpiCard label="Denial Rate" value={`${metrics.denialRate.toFixed(1)}%`} sub={`Median ${metrics.benchmarkMedian}%`} accent="#bd852f" icon={ShieldAlert} />
        <KpiCard label="Net Collection" value={`${(metrics as { netCollectionRate?: number }).netCollectionRate ? ((metrics as { netCollectionRate?: number }).netCollectionRate! * 100).toFixed(1) : "94.2"}%`} sub="Industry median 95.4%" accent="#0b2734" icon={DollarSign} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] md:gap-[18px]">
        {/* Leakage Trend */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Leakage Trend</h2>
          <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 18 }}>Monthly leakage, Jan – May 2026</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={leakageTrend}>
              <defs>
                <linearGradient id="leakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c2553d" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#c2553d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(11,39,52,0.06)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} tickFormatter={(v) => `$${v / 1000}K`} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area type="monotone" dataKey="leakage" stroke="#c2553d" strokeWidth={2.5} fill="url(#leakGrad)" dot={{ fill: "#fff", stroke: "#c2553d", strokeWidth: 2, r: 4 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Denial Rate by Payer */}
        <div style={{ ...CARD, padding: "22px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>Denial Rate by Payer</h2>
          <p style={{ fontSize: 12.5, color: "#5c747e", marginBottom: 18 }}>vs. median 11.8% and best-in-class 5.2%</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={payerBars} layout="vertical" barSize={16} margin={{ left: 12, right: 50 }}>
              <CartesianGrid horizontal={false} stroke="rgba(11,39,52,0.06)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fill: "#8aa0a8" }} tickFormatter={(v) => `${v}%`} domain={[0, 28]} />
              <YAxis type="category" dataKey="payer" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#0b2734", fontWeight: 500 }} width={44} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "Denial Rate"]} />
              <ReferenceLine x={11.8} stroke="#bd852f" strokeDasharray="4 3" label={{ value: "Median", position: "top", fontSize: 10, fill: "#bd852f", fontFamily: "'IBM Plex Mono', monospace" }} />
              <ReferenceLine x={5.2} stroke="#14b8a6" strokeDasharray="4 3" label={{ value: "Best", position: "top", fontSize: 10, fill: "#14b8a6", fontFamily: "'IBM Plex Mono', monospace" }} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", fill: "#5c747e", formatter: (v: unknown) => `${Number(v).toFixed(1)}%` }}>
                {payerBars.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Underpayment Detection Banner */}
      {(() => {
        const annualClaims = Math.round((metrics.totalLeakage * 12) / 0.171 / 1000000 * 3125);
        const lineItems = annualClaims * 2.4;
        const underpaidCount = Math.round(lineItems * 0.027);
        const underpaymentExposure = Math.round(underpaidCount * 38);
        return (
          <div style={{ background: "linear-gradient(160deg, rgba(12,129,116,0.06), rgba(20,184,166,0.04))", border: "1px solid rgba(12,129,116,0.20)", borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "#e4f4f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DollarSign style={{ width: 18, height: 18, color: "#0c8174" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "#0b2734", marginBottom: 3 }}>
                Underpayment Detection — estimated <b style={{ color: "#0c8174" }}>${underpaymentExposure.toLocaleString()}</b> in payer shortfalls
              </div>
              <div style={{ fontSize: 12.5, color: "#5c747e", lineHeight: 1.5 }}>
                Industry data: 2.5–3% of line items are underpaid at avg $38 shortfall · ~{underpaidCount.toLocaleString()} line items affected · Upload payer contracts to verify against your contracted rates
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
              {[
                { label: "Industry Rate", value: "2.7%", sub: "of line items underpaid" },
                { label: "Avg Shortfall", value: "$38", sub: "per underpaid line item" },
                { label: "Your Exposure", value: `$${Math.round(underpaymentExposure / 1000)}K`, sub: "estimated annual" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8" }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0c8174", fontVariantNumeric: "tabular-nums", lineHeight: 1.2, marginTop: 3 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#8aa0a8" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Findings card */}
      <div style={{ ...CARD, padding: "22px 24px" }}>
        {/* Tabs + status filter row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "1px solid rgba(11,39,52,0.10)", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "11px 16px",
                fontSize: 14,
                fontWeight: 600,
                color: activeTab === t.id ? "#0b2734" : "#5c747e",
                borderBottom: activeTab === t.id ? "2px solid #14b8a6" : "2px solid transparent",
                marginBottom: -1,
                background: "none",
                border: "none",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: activeTab === t.id ? "#14b8a6" : "transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
          </div>

          {/* Status filter chips */}
          <div style={{ display: "flex", gap: 6, paddingBottom: 10, flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((chip) => {
              const active = statusFilter === chip.id;
              const count = chip.id === "all" ? allFindings.length : statusCounts[chip.id as FindingStatus];
              const cfg = chip.id !== "all" ? STATUS_CONFIG[chip.id as FindingStatus] : null;
              return (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 28, padding: "0 11px", borderRadius: 999,
                    border: active ? `1px solid ${cfg?.border ?? "#0b2734"}` : "1px solid rgba(11,39,52,0.10)",
                    background: active ? (cfg?.bg ?? "#0b2734") : "#fff",
                    color: active ? (cfg?.color ?? "#fff") : "#5c747e",
                    fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {chip.label}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, opacity: 0.7 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Findings accordions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayFindings.map((f, i) => {
            const isOpen = openFinding === i;
            const fid = findingId(f.label, f.payer);
            const currentStatus = getStatus(fid);
            const statusCfg = STATUS_CONFIG[currentStatus];
            return (
              <div
                key={f.label}
                style={{
                  border: "1px solid rgba(11,39,52,0.10)",
                  borderRadius: 14,
                  background: "#fff",
                  overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
                }}
              >
                {/* Header */}
                <button
                  onClick={() => setOpenFinding(isOpen ? null : i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "18px 20px",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600, color: "#8aa0a8", width: 16, flexShrink: 0 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0b2734" }}>{f.label}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.10)", color: "#5c747e" }}>
                        {f.payer}
                      </span>
                      {currentStatus !== "open" && (
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12.5, color: "#5c747e", marginTop: 3 }}>{f.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 28, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>At Risk</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#c2553d", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{fmt(f.dollarAmount)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>Recovery</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#0c8174", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{fmt(f.expectedRecovery)}</p>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: f.difficulty === "easy" ? "#e4f4f1" : f.difficulty === "hard" ? "#f8e8e3" : "#f8efdd",
                        color: f.difficulty === "easy" ? "#0c8174" : f.difficulty === "hard" ? "#c2553d" : "#9a6a1e",
                        textTransform: "capitalize",
                      }}
                    >
                      {f.difficulty}
                    </span>
                  </div>
                  <ChevronDown
                    style={{
                      width: 18,
                      height: 18,
                      color: "#8aa0a8",
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Body */}
                {isOpen && (
                  <div style={{ padding: "0 20px 20px 52px" }}>
                    {/* Status row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: currentStatus === "resolved" ? 10 : 20, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8" }}>
                        Status
                      </span>
                      {(Object.keys(STATUS_CONFIG) as FindingStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const active = getStatus(findingId(f.label, f.payer)) === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(findingId(f.label, f.payer), s)}
                            style={{
                              height: 28, padding: "0 12px", borderRadius: 999,
                              border: `1px solid ${active ? cfg.border : "rgba(11,39,52,0.10)"}`,
                              background: active ? cfg.bg : "#fff",
                              color: active ? cfg.color : "#8aa0a8",
                              fontSize: 12.5, fontWeight: active ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Recovery amount input — shown when status is resolved */}
                    {currentStatus === "resolved" && (() => {
                      const fid = findingId(f.label, f.payer);
                      const existing = getRecoveredAmount(fid);
                      const inputVal = recoveryInputs[fid] ?? (existing > 0 ? String(existing) : "");
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", borderRadius: 8, background: "#e4f4f1", border: "1px solid rgba(12,129,116,0.2)" }}>
                          <CheckCircle2 size={15} color="#0c8174" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: "#0c8174", fontWeight: 600, whiteSpace: "nowrap" }}>Actual recovered:</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <span style={{ fontSize: 13, color: "#5c747e" }}>$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={String(Math.round(f.expectedRecovery))}
                              value={inputVal}
                              onChange={(e) => setRecoveryInputs((prev) => ({ ...prev, [fid]: e.target.value }))}
                              style={{ width: 110, height: 28, padding: "0 8px", border: "1px solid rgba(12,129,116,0.35)", borderRadius: 6, fontSize: 13, fontVariantNumeric: "tabular-nums", background: "#fff", color: "#0b2734", outline: "none" }}
                            />
                          </div>
                          <button
                            onClick={() => { const amt = parseFloat(inputVal); if (!isNaN(amt) && amt >= 0) setStatus(fid, "resolved", amt); }}
                            style={{ height: 28, padding: "0 12px", borderRadius: 6, border: "none", background: "#0c8174", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                          >
                            Save
                          </button>
                          {existing > 0 && (
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#0c8174" }}>Saved: ${existing.toLocaleString()}</span>
                          )}
                        </div>
                      );
                    })()}

                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8", marginBottom: 8 }}>
                      Recommended Action
                    </p>
                    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13.5, color: "#5c747e", lineHeight: 1.6, maxWidth: "70ch" }}>{f.action}</p>
                        {f.denialCodes.length > 0 && (
                          <>
                            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8", marginTop: 14, marginBottom: 8 }}>
                              Denial Codes
                            </p>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {f.denialCodes.map((c) => (
                                <span key={c} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.10)", color: "#5c747e" }}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {/* Recovery estimate box */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: 200,
                          padding: "16px 18px",
                          borderRadius: 12,
                          background: "#e4f4f1",
                          border: "1px solid rgba(12,129,116,0.2)",
                        }}
                      >
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0c8174" }}>Recovery Estimate</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: "#0c8174", letterSpacing: "-0.03em", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{fmt(f.expectedRecovery)}</p>
                        <p style={{ fontSize: 11.5, color: "#5c747e", marginTop: 3 }}>{Math.round(f.recoveryProbability * 100)}% probability-weighted</p>
                      </div>
                    </div>

                    {/* Generate Appeal Letter button — only when denial codes exist */}
                    {f.denialCodes.length > 0 && (
                      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setAppealFinding({
                            label: f.label,
                            payer: f.payer,
                            denialCodes: f.denialCodes,
                            dollarAmount: f.dollarAmount,
                            expectedRecovery: f.expectedRecovery,
                            description: f.description,
                            action: f.action,
                            cptCodes: f.cptCodes,
                          })}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            height: 32,
                            padding: "0 14px",
                            borderRadius: 8,
                            border: "1px solid rgba(20,184,166,0.45)",
                            background: "rgba(20,184,166,0.06)",
                            color: "#0c8174",
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <FileText style={{ width: 13, height: 13 }} />
                          Generate Appeal Letter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AppealLetterModal
        open={!!appealFinding}
        onClose={() => setAppealFinding(null)}
        finding={appealFinding}
        practiceName={practiceName}
      />
    </div>
  );
}
