"use client";

import { useState } from "react";
import { TrendingUp, ShieldAlert, DollarSign, Users, ChevronDown, ChevronUp, Search, Building2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

// ── Mock multi-practice data ────────────────────────────────────────────────
// Replace with GET /admin/practices once backend endpoint is wired

const MOCK_PRACTICES = [
  {
    id: "p1", name: "Riverview Family Medicine", specialty: "Family Medicine", providers: 4,
    plan: "growth", status: "active",
    metrics: { leakage: 83440, recovery: 51280, denialRate: 14.2, grade: "D", daysInAR: 34, lastAudit: "May 31, 2026" },
    alerts: 2, openFindings: 6,
  },
  {
    id: "p2", name: "Northgate Internal Medicine", specialty: "Internal Medicine", providers: 3,
    plan: "starter", status: "active",
    metrics: { leakage: 61200, recovery: 38500, denialRate: 11.8, grade: "C", daysInAR: 41, lastAudit: "May 28, 2026" },
    alerts: 1, openFindings: 4,
  },
  {
    id: "p3", name: "Westside Pediatrics", specialty: "Pediatrics", providers: 2,
    plan: "starter", status: "active",
    metrics: { leakage: 29800, recovery: 18600, denialRate: 8.4, grade: "B", daysInAR: 28, lastAudit: "Jun 1, 2026" },
    alerts: 0, openFindings: 2,
  },
  {
    id: "p4", name: "Harbor Behavioral Health", specialty: "Psychiatry", providers: 5,
    plan: "growth", status: "active",
    metrics: { leakage: 112000, recovery: 74200, denialRate: 19.6, grade: "F", daysInAR: 52, lastAudit: "May 22, 2026" },
    alerts: 4, openFindings: 9,
  },
  {
    id: "p5", name: "Sunrise Cardiology", specialty: "Cardiology", providers: 6,
    plan: "enterprise", status: "active",
    metrics: { leakage: 198400, recovery: 141000, denialRate: 13.1, grade: "C", daysInAR: 38, lastAudit: "Jun 2, 2026" },
    alerts: 1, openFindings: 7,
  },
];

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

const GRADE_COLOR: Record<string, string> = { A: "#0c8174", B: "#0c8174", C: "#bd852f", D: "#c2553d", F: "#c2553d" };
const GRADE_BG: Record<string, string> = { A: "#e4f4f1", B: "#e4f4f1", C: "#f8efdd", D: "#f8e8e3", F: "#f8e8e3" };
const PLAN_COLOR: Record<string, string> = { starter: "#5c747e", growth: "#bd852f", enterprise: "#0c8174" };

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"leakage" | "denialRate" | "alerts" | "name">("leakage");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MOCK_PRACTICES
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.specialty.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortBy === "name") { av = a.name; bv = b.name; }
      else if (sortBy === "leakage") { av = a.metrics.leakage; bv = b.metrics.leakage; }
      else if (sortBy === "denialRate") { av = a.metrics.denialRate; bv = b.metrics.denialRate; }
      else { av = a.alerts; bv = b.alerts; }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const totals = MOCK_PRACTICES.reduce((acc, p) => ({
    leakage: acc.leakage + p.metrics.leakage,
    recovery: acc.recovery + p.metrics.recovery,
    alerts: acc.alerts + p.alerts,
    findings: acc.findings + p.openFindings,
  }), { leakage: 0, recovery: 0, alerts: 0, findings: 0 });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <ChevronDown style={{ width: 12, height: 12, opacity: 0.3 }} />;
    return sortDir === "desc"
      ? <ChevronDown style={{ width: 12, height: 12, color: "#14b8a6" }} />
      : <ChevronUp style={{ width: 12, height: 12, color: "#14b8a6" }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1340, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e9eded", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 style={{ width: 15, height: 15, color: "#0b2734" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#0b2734", margin: 0 }}>Admin Dashboard</h1>
          </div>
          <p style={{ fontSize: 13, color: "#5c747e", margin: 0 }}>
            {MOCK_PRACTICES.length} practices · {MOCK_PRACTICES.reduce((s, p) => s + p.providers, 0)} providers · All active
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(11,39,52,0.14)", background: "#fff", color: "#5c747e", fontSize: 13 }}>
          <Search style={{ width: 13, height: 13 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search practices…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: 180, color: "#0b2734" }}
          />
        </div>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] md:gap-[18px]">
        {[
          { label: "Total Leakage", value: fmt(totals.leakage), sub: "across all practices", accent: "#c2553d", icon: TrendingUp },
          { label: "Expected Recovery", value: fmt(totals.recovery), sub: "probability-weighted", accent: "#0c8174", icon: DollarSign },
          { label: "Open Alerts", value: String(totals.alerts), sub: "requiring attention", accent: "#bd852f", icon: AlertTriangle },
          { label: "Open Findings", value: String(totals.findings), sub: "across all practices", accent: "#0b2734", icon: ShieldAlert },
        ].map(({ label, value, sub, accent, icon: Icon }) => (
          <div key={label} style={{ ...CARD, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8" }}>{label}</span>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: accent + "18", color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon style={{ width: 13, height: 13 }} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.035em", color: accent, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>{value}</div>
            <div style={{ fontSize: 12, color: "#5c747e", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Practice table */}
      <div style={{ ...CARD, padding: "0" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px 40px", gap: "0 12px", padding: "12px 20px", borderBottom: "1px solid rgba(11,39,52,0.08)", alignItems: "center" }}>
          {[
            { label: "Practice", col: "name" as const },
            { label: "Leakage", col: "leakage" as const },
            { label: "Recovery", col: null },
            { label: "Denial Rate", col: "denialRate" as const },
            { label: "Alerts", col: "alerts" as const },
            { label: "Plan", col: null },
            { label: "", col: null },
          ].map(({ label, col }) => (
            <button
              key={label}
              onClick={() => col && toggleSort(col)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8", background: "none", border: "none", cursor: col ? "pointer" : "default", padding: 0, textAlign: "left" }}
            >
              {label}
              {col && <SortIcon col={col} />}
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.map((p) => (
          <div key={p.id}>
            <div
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px 40px", gap: "0 12px", padding: "16px 20px", borderBottom: "1px solid rgba(11,39,52,0.06)", alignItems: "center", cursor: "pointer", transition: "background 0.1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbfb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Practice name */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0b2734" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#8aa0a8", marginTop: 1 }}>{p.specialty} · {p.providers} providers</div>
              </div>

              {/* Leakage */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: "#c2553d" }}>{fmt(p.metrics.leakage)}</div>
                <div style={{ fontSize: 11, color: "#8aa0a8" }}>at risk</div>
              </div>

              {/* Recovery */}
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: "#0c8174" }}>{fmt(p.metrics.recovery)}</div>
                <div style={{ fontSize: 11, color: "#8aa0a8" }}>recoverable</div>
              </div>

              {/* Denial rate */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: GRADE_COLOR[p.metrics.grade] }}>
                  {p.metrics.denialRate}%
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: GRADE_BG[p.metrics.grade], color: GRADE_COLOR[p.metrics.grade] }}>
                  {p.metrics.grade}
                </span>
              </div>

              {/* Alerts */}
              <div>
                {p.alerts > 0 ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "#c2553d" }}>
                    <AlertTriangle style={{ width: 13, height: 13 }} />
                    {p.alerts} alert{p.alerts > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0c8174" }}>
                    <CheckCircle2 style={{ width: 13, height: 13 }} /> Clear
                  </span>
                )}
              </div>

              {/* Plan */}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#f6f8f8", color: PLAN_COLOR[p.plan] ?? "#5c747e", textTransform: "capitalize" }}>
                {p.plan}
              </span>

              {/* Expand */}
              <ChevronDown style={{ width: 15, height: 15, color: "#8aa0a8", transition: "transform 0.2s", transform: expandedId === p.id ? "rotate(180deg)" : "none" }} />
            </div>

            {/* Expanded detail */}
            {expandedId === p.id && (
              <div style={{ padding: "16px 20px 20px", background: "#fafbfb", borderBottom: "1px solid rgba(11,39,52,0.06)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Days in A/R", value: `${p.metrics.daysInAR}`, sub: "Target: < 35 days", color: p.metrics.daysInAR > 40 ? "#c2553d" : "#0c8174" },
                    { label: "Open Findings", value: String(p.openFindings), sub: "requiring action", color: "#bd852f" },
                    { label: "Last Audit", value: p.metrics.lastAudit, sub: "most recent 835", color: "#0b2734" },
                    { label: "Status", value: "Active", sub: "subscription current", color: "#0c8174" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "10px 14px", borderRadius: 10, background: "#fff", border: "1px solid rgba(11,39,52,0.08)" }}>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#8aa0a8", marginTop: 2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                  <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(11,39,52,0.14)", background: "#fff", color: "#0b2734", fontSize: 12.5, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
                    View Dashboard →
                  </a>
                  <button style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(11,39,52,0.14)", background: "#fff", color: "#5c747e", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    <Clock style={{ width: 12, height: 12 }} /> Audit History
                  </button>
                  <button style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(11,39,52,0.14)", background: "#fff", color: "#5c747e", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    <Users style={{ width: 12, height: 12 }} /> Manage Team
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: 11.5, color: "#8aa0a8", textAlign: "center" }}>
        Admin view — visible to Simera team only · Practice data is isolated by RLS
      </p>
    </div>
  );
}
