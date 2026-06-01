"use client";

import { useState, useMemo } from "react";
import { Zap } from "lucide-react";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
  padding: "22px 24px",
};

const PLANS = [
  { id: "solo", name: "Solo", desc: "1 provider", price: 299 },
  { id: "small", name: "Small Group", desc: "2–5 providers", price: 599 },
  { id: "group", name: "Group Practice", desc: "6–10 providers", price: 999 },
];

const SPECIALTIES = [
  { value: "family_medicine", label: "Family Medicine", leakage: 0.171 },
  { value: "internal_medicine", label: "Internal Medicine", leakage: 0.158 },
  { value: "pediatrics", label: "Pediatrics", leakage: 0.142 },
  { value: "cardiology", label: "Cardiology", leakage: 0.195 },
  { value: "orthopedics", label: "Orthopedics", leakage: 0.188 },
  { value: "dermatology", label: "Dermatology", leakage: 0.163 },
  { value: "psychiatry", label: "Psychiatry", leakage: 0.145 },
  { value: "other", label: "Other", leakage: 0.165 },
];

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

  const spec = SPECIALTIES.find((s) => s.value === specialty) ?? SPECIALTIES[0];
  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[1];

  const roi = useMemo(() => {
    const annualRevenue = monthlyCollections * 12;
    const leakageFound = Math.round(annualRevenue * spec.leakage * (denialRate / 14));
    const expectedRecovery = Math.round(leakageFound * 0.615);
    const annualCost = plan.price * 12;
    const annualReturn = expectedRecovery - annualCost;
    const roiPct = annualCost > 0 ? Math.round((annualReturn / annualCost) * 100) : 0;
    const paybackDays = expectedRecovery > 0 ? Math.round((annualCost / expectedRecovery) * 365) : 0;
    return { annualRevenue, leakageFound, expectedRecovery, annualCost, annualReturn, roiPct, paybackDays };
  }, [monthlyCollections, spec, denialRate, plan]);

  const handleMoneyInput = (raw: string) => {
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) setMonthlyCollections(Math.max(20000, Math.min(500000, num)));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }}>

      {/* Left — inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Your Practice */}
        <div style={CARD}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 22px" }}>Your Practice</h2>

          {/* Monthly Collections */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>Monthly Collections</span>
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
          </div>

          {/* Specialty */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>Specialty</span>
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                style={{ width: "100%", height: 50, padding: "0 16px", borderRadius: 12, border: "1px solid rgba(11,39,52,0.10)", background: "#f6f8f8", fontFamily: "inherit", fontSize: 15, fontWeight: 600, color: "#0b2734", appearance: "none", cursor: "pointer" }}
              >
                {SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Denial Rate */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>Current Denial Rate</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#c2553d" }}>{denialRate}%</span>
            </div>
            <input
              type="range" min={5} max={30} step={0.5}
              value={denialRate}
              onChange={(e) => setDenialRate(Number(e.target.value))}
              style={{ width: "100%", height: 6, borderRadius: 4, margin: "0 0 4px", cursor: "pointer", accentColor: "#c2553d" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8aa0a8", fontFamily: "'IBM Plex Mono', monospace" }}>
              <span>5%</span><span>30%</span>
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
      </div>

      {/* Right — results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 0 }}>

        {/* ROI Hero */}
        <div style={{ background: "linear-gradient(150deg, #0b2734, #07202b)", color: "#fff", borderRadius: 16, padding: "30px 32px", boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -100, top: -100, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.16), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28, position: "relative", zIndex: 1 }}>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6" }}>Expected Annual Return</p>
              <p style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 10, color: "#14b8a6", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {formatMoney(roi.annualReturn)}
              </p>
              <p style={{ fontSize: 13.5, color: "#8fabb5", marginTop: 8 }}>vs. {formatMoney(roi.annualCost)}/year cost</p>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6", whiteSpace: "nowrap" }}>ROI</p>
              <p style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 10, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {roi.roiPct > 999 ? "999+%" : `${roi.roiPct}%`}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginTop: 24, padding: "18px 20px", borderRadius: 13, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", position: "relative", zIndex: 1 }}>
            <Zap style={{ width: 20, height: 20, color: "#14b8a6", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#eaf2f3" }}>
              Payback in <b style={{ color: "#fff", fontWeight: 700 }}>{roi.paybackDays} days.</b> Simera pays for itself within the first month.
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div style={CARD}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "#0b2734", margin: "0 0 4px" }}>How We Get There</h2>
          <div>
            {[
              { name: "Annual Revenue Analyzed", desc: "Monthly × 12", amount: formatMoney(roi.annualRevenue), color: "#0b2734" },
              { name: "Estimated Leakage Found", desc: `${(spec.leakage * 100 * (denialRate / 14)).toFixed(1)}% of revenue`, amount: formatMoney(roi.leakageFound), color: "#c2553d" },
              { name: "Expected Recovery", desc: "~61.5% probability-weighted", amount: formatMoney(roi.expectedRecovery), color: "#0c8174" },
              { name: "Simera Annual Subscription", desc: `${plan.name} · $${plan.price}/mo`, amount: `−${formatMoney(roi.annualCost)}`, color: "#c2553d" },
            ].map((row, i) => (
              <div key={row.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "16px 0", borderBottom: i < 3 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 600, color: "#0b2734" }}>{row.name}</p>
                  <p style={{ fontSize: 12.5, color: "#5c747e", marginTop: 2 }}>{row.desc}</p>
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", flexShrink: 0, whiteSpace: "nowrap", color: row.color }}>
                  {row.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
