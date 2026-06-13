"use client";

/**
 * RecoveryFunnel — the proof ledger. Shows the practice's money moving from
 * Identified → Submitted → In progress → Recovered, with recovered cash as the
 * hero number. This is the figure that sells a pilot and an investor.
 *
 * "Identified" comes from the audit findings (passed by the page). The other
 * three stages come from useAppealSubmissions(), which stays live via in-tab sync.
 */
import { ArrowRight } from "lucide-react";
import { useAppealSubmissions } from "@/lib/use-appeal-submissions";

interface RecoveryFunnelProps {
  identifiedCount: number;
  identifiedRecoverable: number; // $ recoverable via appeal (probability-weighted)
  identifiedAtRisk: number;      // $ total denial exposure
}

function money(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function Stage({
  label, value, sub, hero,
}: { label: string; value: string; sub: string; hero?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 110 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
        {label}
      </p>
      <p style={{
        fontSize: hero ? 30 : 22, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15,
        margin: "2px 0 0", color: hero ? "#0c8174" : "#0b2734",
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: "#8aa0a8", margin: "1px 0 0" }}>{sub}</p>
    </div>
  );
}

export function RecoveryFunnel({ identifiedCount, identifiedRecoverable, identifiedAtRisk }: RecoveryFunnelProps) {
  const {
    totalSubmitted, totalSubmittedValue,
    inProgress, totalInProgressValue,
    totalWon, totalRecoveredViaAppeals, winRate,
  } = useAppealSubmissions();

  const recoveryRate = identifiedRecoverable > 0
    ? Math.min(100, Math.round((totalRecoveredViaAppeals / identifiedRecoverable) * 100))
    : 0;

  const arrow = (
    <ArrowRight style={{ width: 16, height: 16, color: "#cfd9dc", flexShrink: 0, alignSelf: "center" }} aria-hidden="true" />
  );

  return (
    <div style={{
      border: "1px solid rgba(11,39,52,0.10)", borderRadius: 16, background: "#fff",
      boxShadow: "0 1px 4px rgba(11,39,52,0.06)", padding: "18px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0b2734" }}>Recovery funnel</span>
        {winRate !== null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0c8174", background: "#e4f4f1", padding: "3px 9px", borderRadius: 20 }}>
            {winRate}% win rate
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
        <Stage label="Identified" value={money(identifiedRecoverable)} sub={`${identifiedCount} denial${identifiedCount !== 1 ? "s" : ""} · ${money(identifiedAtRisk)} at risk`} />
        {arrow}
        <Stage label="Submitted" value={money(totalSubmittedValue)} sub={`${totalSubmitted} appeal${totalSubmitted !== 1 ? "s" : ""} filed`} />
        {arrow}
        <Stage label="In progress" value={money(totalInProgressValue)} sub={`${inProgress.length} awaiting payer`} />
        {arrow}
        <Stage label="Recovered" value={money(totalRecoveredViaAppeals)} sub={`${totalWon} won · banked`} hero />
      </div>

      {/* Recovery-rate progress: recovered vs identified-recoverable */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#5c747e" }}>Recovered of identified-recoverable</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#0b2734" }}>{recoveryRate}%</span>
        </div>
        <div style={{ height: 6, background: "#e9eded", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${recoveryRate}%`, background: "#14b8a6", borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
        {totalWon === 0 && (
          <p style={{ fontSize: 11, color: "#8aa0a8", margin: "8px 0 0" }}>
            No recovered dollars yet — work the top of your queue, then log the outcome to start banking cash here.
          </p>
        )}
      </div>
    </div>
  );
}
