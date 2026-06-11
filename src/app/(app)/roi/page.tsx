"use client";

import { useState, useMemo, useEffect } from "react";
import { Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
  padding: "22px 24px",
};

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  letterSpacing: "0.13em",
  textTransform: "uppercase" as const,
  color: "#8aa0a8",
};

const PLANS = [
  { id: "solo", name: "Solo", desc: "1 provider", price: 299 },
  { id: "small", name: "Small Group", desc: "2–5 providers", price: 599 },
  { id: "group", name: "Group Practice", desc: "6–10 providers", price: 999 },
];

// Specialty leakage rates + MGMA annual revenue per physician
const SPECIALTIES = [
  { value: "family_medicine",  label: "Family Medicine",   leakage: 0.171, annualRevenuePerProvider: 1150000 },
  { value: "internal_medicine",label: "Internal Medicine", leakage: 0.158, annualRevenuePerProvider: 1350000 },
  { value: "pediatrics",       label: "Pediatrics",        leakage: 0.142, annualRevenuePerProvider: 1050000 },
  { value: "cardiology",       label: "Cardiology",        leakage: 0.195, annualRevenuePerProvider: 2400000 },
  { value: "orthopedics",      label: "Orthopedics",       leakage: 0.188, annualRevenuePerProvider: 2700000 },
  { value: "gastroenterology", label: "Gastroenterology",  leakage: 0.182, annualRevenuePerProvider: 1900000 },
  { value: "dermatology",      label: "Dermatology",       leakage: 0.163, annualRevenuePerProvider: 1600000 },
  { value: "psychiatry",       label: "Psychiatry",        leakage: 0.145, annualRevenuePerProvider: 1100000 },
  { value: "general_surgery",  label: "General Surgery",   leakage: 0.178, annualRevenuePerProvider: 1750000 },
  { value: "other",            label: "Other",             leakage: 0.165, annualRevenuePerProvider: 1300000 },
];

// Industry constants from research (MGMA/HFMA 2024)
const COST_TO_REWORK = 57.23;          // avg cost per denied claim rework
const ABANDONMENT_RATE = 0.50;         // 35–60% of denials never resubmitted; use 50%
const AVG_CLAIM_VALUE = 320;           // average claim value for small practices
const UNDERPAYMENT_RATE = 0.027;       // 2.5–3% of line items underpaid
const UNDERPAYMENT_AVG_SHORTFALL = 38; // avg $38 per underpaid line item
const CLAIMS_PER_MILLION_REVENUE = 3125; // ~$320 avg claim → 3,125 claims/$1M revenue

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function formatInput(n: number): string {
  return n.toLocaleString();
}

export default function ROIPage() {
  const [monthlyCollections, setMonthlyCollections] = useState(100000);
  const [specialty, setSpecialty] = useState("family_medicine");
  const [denialRate, setDenialRate] = useState(14);
  const [selectedPlan, setSelectedPlan] = useState("small");
  const [prefilled, setPrefilled] = useState(false);

  const { metrics, isLive } = useAuditData();

  // Pre-populate denial rate from real 835 data when available
  useEffect(() => {
    if (isLive && !prefilled && metrics.denialRate > 0) {
      const rounded = Math.min(30, Math.max(5, Math.round(metrics.denialRate * 2) / 2)); // clamp to slider range
      setDenialRate(rounded);
      setPrefilled(true);
    }
  }, [isLive, metrics.denialRate, prefilled]);

  const spec = SPECIALTIES.find((s) => s.value === specialty) ?? SPECIALTIES[0];
  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[1];

  const roi = useMemo(() => {
    const annualRevenue = monthlyCollections * 12;
    const annualClaims = Math.round((annualRevenue / 1000000) * CLAIMS_PER_MILLION_REVENUE);

    // Denial recovery
    const deniedClaims = Math.round(annualClaims * (denialRate / 100));
    const abandonedClaims = Math.round(deniedClaims * ABANDONMENT_RATE);
    const abandonedRevenue = Math.round(abandonedClaims * AVG_CLAIM_VALUE);
    // Recovery probability weighted by payer mix (~61.5% weighted average overturn rate)
    const recoveredFromDenials = Math.round(abandonedRevenue * 0.615);

    // Rework cost savings (fewer reworks because we catch pre-submission)
    const reworkCostSavings = Math.round(deniedClaims * 0.30 * COST_TO_REWORK); // 30% fewer reworks

    // Underpayment recovery
    const estimatedLineItems = annualClaims * 2.4; // avg ~2.4 line items per claim
    const underpaidItems = Math.round(estimatedLineItems * UNDERPAYMENT_RATE);
    const underpaymentRecovery = Math.round(underpaidItems * UNDERPAYMENT_AVG_SHORTFALL * 0.70); // 70% recovery rate

    // A/R improvement: 5-day DAR improvement → accelerated cash
    const arImprovement = Math.round((annualRevenue / 365) * 5);

    const totalRecovery = recoveredFromDenials + reworkCostSavings + underpaymentRecovery;
    const annualCost = plan.price * 12;
    const annualReturn = totalRecovery - annualCost;
    const roiPct = annualCost > 0 ? Math.round((annualReturn / annualCost) * 100) : 0;
    const paybackDays = totalRecovery > 0 ? Math.round((annualCost / totalRecovery) * 365) : 0;

    return {
      annualRevenue,
      annualClaims,
      deniedClaims,
      abandonedClaims,
      abandonedRevenue,
      recoveredFromDenials,
      reworkCostSavings,
      underpaymentRecovery,
      arImprovement,
      totalRecovery,
      annualCost,
      annualReturn,
      roiPct,
      paybackDays,
    };
  }, [monthlyCollections, spec, denialRate, plan]);

  const handleMoneyInput = (raw: string) => {
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) setMonthlyCollections(Math.max(20000, Math.min(500000, num)));
  };

  const industryBenchmarkDenial = 11.8;
  const isAboveMedian = denialRate > industryBenchmarkDenial;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-[14px] md:gap-[18px]" style={{ alignItems: "start" }}>

      {/* Left — inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Your Practice */}
        <div style={CARD}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 22px" }}>Your Practice</h2>

          {/* Monthly Collections */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={MONO}>Monthly Collections</span>
              <b style={{ fontSize: 15, fontWeight: 800, color: "#0b2734" }}>${formatInput(monthlyCollections)}</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 16px", borderRadius: 12, border: "1px solid rgba(11,39,52,0.10)", background: "#f6f8f8" }}>
              <span style={{ color: "#8aa0a8", fontSize: 17 }}>$</span>
              <input
                type="text"
                value={formatInput(monthlyCollections)}
                onChange={(e) => handleMoneyInput(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "'IBM Plex Mono', monospace", fontSize: 19, fontWeight: 600, color: "#0b2734" }}
              />
            </div>
            <input
              type="range" min={20000} max={500000} step={5000}
              value={monthlyCollections}
              onChange={(e) => setMonthlyCollections(Number(e.target.value))}
              style={{ width: "100%", height: 6, borderRadius: 4, margin: "10px 0 4px", cursor: "pointer", accentColor: "#0b2734" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8aa0a8", fontFamily: "'IBM Plex Mono', monospace" }}>
              <span>$20K</span><span>$500K</span>
            </div>
            {/* MGMA specialty benchmark callout */}
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.08)" }}>
              <span style={{ fontSize: 12, color: "#5c747e" }}>
                MGMA benchmark for {spec.label}: <b style={{ color: "#0b2734" }}>${formatMoney(spec.annualRevenuePerProvider / 12)}/mo per provider</b>
              </span>
            </div>
          </div>

          {/* Specialty */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={MONO}>Specialty</span>
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{ width: "100%", height: 50, padding: "0 16px", borderRadius: 12, border: "1px solid rgba(11,39,52,0.10)", background: "#f6f8f8", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: "#0b2734", appearance: "none", cursor: "pointer" }}
            >
              {SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Denial Rate */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={MONO}>Current Denial Rate{prefilled ? " ↑ from your 835" : ""}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isAboveMedian && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#f8e8e3", color: "#c2553d" }}>
                    above {industryBenchmarkDenial}% median
                  </span>
                )}
                <span style={{ fontSize: 15, fontWeight: 800, color: "#c2553d" }}>{denialRate}%</span>
              </div>
            </div>
            <input
              type="range" min={5} max={30} step={0.5}
              value={denialRate}
              onChange={(e) => setDenialRate(Number(e.target.value))}
              style={{ width: "100%", height: 6, borderRadius: 4, margin: "0 0 4px", cursor: "pointer", accentColor: "#c2553d" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8aa0a8", fontFamily: "'IBM Plex Mono', monospace" }}>
              <span>5% (best-in-class)</span><span>30%</span>
            </div>
            {/* Claim count context */}
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.08)" }}>
              <span style={{ fontSize: 12, color: "#5c747e" }}>
                Estimated <b style={{ color: "#0b2734" }}>{roi.deniedClaims.toLocaleString()} denied claims/year</b> · {roi.abandonedClaims.toLocaleString()} abandoned (50% never reworked)
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div style={CARD}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 18px" }}>Subscription Plan</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PLANS.map((p) => {
              const sel = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                    padding: "16px 18px", borderRadius: 13,
                    border: `1px solid ${sel ? "#14b8a6" : "rgba(11,39,52,0.10)"}`,
                    background: sel ? "#e4f4f1" : "#fff",
                    cursor: "pointer",
                    boxShadow: sel ? "0 0 0 3px rgba(20,184,166,0.14)" : "none",
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? "#14b8a6" : "rgba(11,39,52,0.10)"}`, position: "relative", flexShrink: 0 }}>
                    {sel && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: "#14b8a6" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0b2734" }}>{p.name}</p>
                    <p style={{ fontSize: 12.5, color: "#5c747e", marginTop: 1 }}>{p.desc}</p>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#0b2734", flexShrink: 0, whiteSpace: "nowrap" }}>
                    ${p.price}<span style={{ fontSize: 13, fontWeight: 600, color: "#5c747e" }}>/mo</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Industry Context card */}
        <div style={{ ...CARD, background: "linear-gradient(160deg, rgba(11,39,52,0.03), rgba(20,184,166,0.04))" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", margin: "0 0 12px" }}>Industry Benchmarks Used in This Model</h3>
          {[
            { label: "Cost to rework one denied claim", value: `$${COST_TO_REWORK}`, source: "HFMA 2023 — up 30% from 2022" },
            { label: "Denials never resubmitted", value: "50%", source: "Industry average 35–60%" },
            { label: "Avg claim value (small practice)", value: `$${AVG_CLAIM_VALUE}`, source: "CAQH 2023 Index" },
            { label: "Underpayment rate (line items)", value: "2.7%", source: "MGMA 2024 — avg $38 shortfall" },
            { label: "Weighted appeal overturn rate", value: "61.5%", source: "Weighted avg across MA, commercial, Medicaid" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(11,39,52,0.06)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#0b2734", fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#8aa0a8", marginTop: 1 }}>{item.source}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0b2734", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 0 }}>

        {/* ROI Hero */}
        <div style={{ background: "linear-gradient(150deg, #0b2734, #07202b)", color: "#fff", borderRadius: 16, padding: "30px 32px", boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -100, top: -100, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.16), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, position: "relative", zIndex: 1 }}>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6" }}>Expected Annual Return</p>
              <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 10, color: "#14b8a6", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {formatMoney(roi.annualReturn)}
              </p>
              <p style={{ fontSize: 13.5, color: "#8fabb5", marginTop: 8 }}>vs. {formatMoney(roi.annualCost)}/year cost</p>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6", whiteSpace: "nowrap" }}>ROI</p>
              <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 10, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {roi.roiPct > 999 ? "999+%" : `${roi.roiPct}%`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginTop: 24, padding: "18px 20px", borderRadius: 13, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", position: "relative", zIndex: 1 }}>
            <Zap style={{ width: 20, height: 20, color: "#14b8a6", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#eaf2f3" }}>
              Payback in <b style={{ color: "#fff", fontWeight: 700 }}>{roi.paybackDays} days.</b> Simera pays for itself within the first quarter.
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div style={CARD}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>How We Get There</h2>
          <div>
            {[
              {
                name: "Annual Revenue Analyzed",
                desc: `~${roi.annualClaims.toLocaleString()} claims · ${denialRate}% denial rate`,
                amount: formatMoney(roi.annualRevenue),
                color: "#0b2734",
              },
              {
                name: "Denied Claim Recovery",
                desc: `${roi.abandonedClaims.toLocaleString()} abandoned claims × $${AVG_CLAIM_VALUE} × 61.5% overturn`,
                amount: formatMoney(roi.recoveredFromDenials),
                color: "#0c8174",
              },
              {
                name: "Rework Cost Savings",
                desc: `30% fewer reworks × $${COST_TO_REWORK}/claim`,
                amount: formatMoney(roi.reworkCostSavings),
                color: "#0c8174",
              },
              {
                name: "Underpayment Recovery",
                desc: `2.7% underpaid line items × $38 avg shortfall × 70%`,
                amount: formatMoney(roi.underpaymentRecovery),
                color: "#0c8174",
              },
              {
                name: "A/R Acceleration",
                desc: `5-day DAR improvement = accelerated cash`,
                amount: formatMoney(roi.arImprovement),
                color: "#14b8a6",
                dimmed: true,
              },
              {
                name: "Simera Subscription",
                desc: `${plan.name} · $${plan.price}/mo`,
                amount: `−${formatMoney(roi.annualCost)}`,
                color: "#c2553d",
              },
            ].map((row, i) => (
              <div key={row.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "14px 0", borderBottom: i < 5 ? "1px solid rgba(11,39,52,0.06)" : "none", opacity: row.dimmed ? 0.7 : 1 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0b2734" }}>{row.name}</p>
                  <p style={{ fontSize: 11.5, color: "#5c747e", marginTop: 2 }}>{row.desc}</p>
                </div>
                <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", flexShrink: 0, whiteSpace: "nowrap", color: row.color }}>
                  {row.amount}
                </p>
              </div>
            ))}
          </div>
          {/* Total recovery highlight */}
          <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "#e4f4f1", border: "1px solid rgba(12,129,116,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <TrendingUp style={{ width: 16, height: 16, color: "#0c8174" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0c8174" }}>Total Annual Recovery</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#0c8174", fontVariantNumeric: "tabular-nums" }}>{formatMoney(roi.totalRecovery)}</span>
          </div>
        </div>

        {/* Denial math for this practice */}
        <div style={{ ...CARD, background: "linear-gradient(160deg, rgba(194,85,61,0.04), rgba(194,85,61,0.02))", border: "1px solid rgba(194,85,61,0.14)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#c2553d", flexShrink: 0, marginTop: 1 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#c2553d", margin: 0 }}>Denial Impact for Your Practice</h3>
          </div>
          {[
            { label: "Annual claims", value: roi.annualClaims.toLocaleString() },
            { label: `Denied at ${denialRate}%`, value: roi.deniedClaims.toLocaleString() },
            { label: "Abandoned (50% never worked)", value: roi.abandonedClaims.toLocaleString() },
            { label: "Revenue abandoned", value: formatMoney(roi.abandonedRevenue) },
            { label: "Recoverable with Simera", value: formatMoney(roi.recoveredFromDenials), highlight: true },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(194,85,61,0.08)" }}>
              <span style={{ fontSize: 12.5, color: "#5c747e" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.highlight ? "#0c8174" : "#0b2734", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
