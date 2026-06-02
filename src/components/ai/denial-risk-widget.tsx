"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, User, ChevronDown, ChevronUp } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfidenceTier =
  | "auto"               // >90% — automated action safe
  | "review_recommended" // 70–90% — human review recommended
  | "review_required"    // 50–70% — human must sign off
  | "manual";            // <50% — manual review; model not reliable

export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface ShapFactor {
  factor: string;       // e.g. "missing_prior_auth"
  label: string;        // Human-readable: "Missing Prior Authorization"
  contribution: number; // e.g. 0.35 (positive = increases denial risk)
}

export interface DenialRiskPrediction {
  claimId: string;
  denialRiskScore: number;   // 0–1
  riskLevel: RiskLevel;
  confidenceTier: ConfidenceTier;
  topReasons: {
    code: string;
    description: string;
    category: string;
    probabilityContribution: number;
  }[];
  shapFactors: ShapFactor[];
  recommendedActions: string[];
  modelVersion: string;
}

export type ReviewDecision = "accept" | "modify" | "ignore";

interface DenialRiskWidgetProps {
  prediction: DenialRiskPrediction;
  onDecision?: (decision: ReviewDecision, claimId: string) => void;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONFIDENCE_CONFIG: Record<
  ConfidenceTier,
  { label: string; color: string; bg: string; icon: React.ReactNode; description: string }
> = {
  auto: {
    label: "High Confidence",
    color: "#0c8174",
    bg: "rgba(12,129,116,0.10)",
    icon: <CheckCircle size={14} />,
    description: "Model confidence is high — automated action is appropriate.",
  },
  review_recommended: {
    label: "Review Recommended",
    color: "#d97706",
    bg: "rgba(217,119,6,0.10)",
    icon: <Clock size={14} />,
    description: "Human review recommended before submitting this claim.",
  },
  review_required: {
    label: "Review Required",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.10)",
    icon: <AlertTriangle size={14} />,
    description: "Human sign-off required. Model confidence is moderate.",
  },
  manual: {
    label: "Manual Review",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.10)",
    icon: <User size={14} />,
    description: "Low model confidence — manual review by billing specialist required.",
  },
};

const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "#dc2626",
  high: "#d97706",
  medium: "#2563eb",
  low: "#0c8174",
};

function RiskGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75 ? RISK_COLORS.critical :
    pct >= 45 ? RISK_COLORS.high :
    pct >= 20 ? RISK_COLORS.medium :
    RISK_COLORS.low;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#0a1628",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.05em" }}>risk</span>
        </div>
      </div>
    </div>
  );
}

function ShapBar({ factor }: { factor: ShapFactor }) {
  const pct = Math.min(Math.abs(factor.contribution) / 0.5, 1) * 100;
  const color = factor.contribution > 0 ? "#dc2626" : "#0c8174";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span style={{ color: "rgba(255,255,255,0.6)", flex: "0 0 160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {factor.label}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 3,
            background: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ color, fontSize: 11, fontWeight: 600, flex: "0 0 40px", textAlign: "right" }}>
        {factor.contribution > 0 ? "+" : ""}{(factor.contribution * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export default function DenialRiskWidget({
  prediction,
  onDecision,
  compact = false,
}: DenialRiskWidgetProps) {
  const [showShap, setShowShap] = useState(false);
  const [decision, setDecision] = useState<ReviewDecision | null>(null);

  const conf = CONFIDENCE_CONFIG[prediction.confidenceTier];
  const riskColor = RISK_COLORS[prediction.riskLevel];

  const handleDecision = (d: ReviewDecision) => {
    setDecision(d);
    onDecision?.(d, prediction.claimId);
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(160deg, rgba(12,129,116,0.04) 0%, rgba(255,255,255,0.02) 100%)",
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 12,
    padding: compact ? "14px 16px" : "18px 20px",
    fontFamily: "inherit",
    color: "#fff",
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
        <RiskGauge score={prediction.denialRiskScore} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: riskColor,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {prediction.riskLevel} risk
            </span>
            {/* Confidence badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: conf.color,
                background: conf.bg,
                borderRadius: 20,
                padding: "2px 8px",
              }}
            >
              {conf.icon}
              {conf.label}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.4 }}>
            {conf.description}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "4px 0 0", fontFamily: "monospace" }}>
            Claim {prediction.claimId} · {prediction.modelVersion}
          </p>
        </div>
      </div>

      {/* Top reasons */}
      {prediction.topReasons.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            Denial Risk Factors
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {prediction.topReasons.slice(0, compact ? 2 : 4).map((reason, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  borderLeft: `3px solid ${riskColor}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {reason.category}
                    </span>
                    <span style={{ fontSize: 10, color: riskColor, fontWeight: 600 }}>
                      +{(reason.probabilityContribution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.4 }}>
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHAP attribution (expandable) */}
      {prediction.shapFactors.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setShowShap(!showShap)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: showShap ? 8 : 0,
            }}
          >
            {showShap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Feature Attribution (SHAP)
          </button>
          {showShap && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prediction.shapFactors.map((f, i) => (
                <ShapBar key={i} factor={f} />
              ))}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "4px 0 0" }}>
                Positive values increase denial risk · Negative values reduce risk
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommended actions */}
      {!compact && prediction.recommendedActions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            Recommended Actions
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            {prediction.recommendedActions.map((action, i) => (
              <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Human review decision buttons */}
      {prediction.confidenceTier !== "auto" && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
            Billing Specialist Review
          </p>
          {decision ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color:
                  decision === "accept" ? "#0c8174" :
                  decision === "modify" ? "#d97706" :
                  "#7c3aed",
                background:
                  decision === "accept" ? "rgba(12,129,116,0.12)" :
                  decision === "modify" ? "rgba(217,119,6,0.12)" :
                  "rgba(124,58,237,0.12)",
                borderRadius: 8,
                padding: "6px 12px",
              }}
            >
              <CheckCircle size={13} />
              {decision === "accept" ? "Accepted — proceeding with claim" :
               decision === "modify" ? "Flagged for modification" :
               "Suggestion ignored — manual review"}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              {(["accept", "modify", "ignore"] as ReviewDecision[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDecision(d)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      d === "accept" ? "rgba(12,129,116,0.15)" :
                      d === "modify" ? "rgba(217,119,6,0.12)" :
                      "rgba(124,58,237,0.10)",
                    color:
                      d === "accept" ? "#0c8174" :
                      d === "modify" ? "#d97706" :
                      "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {d === "accept" ? "Accept" : d === "modify" ? "Modify" : "Ignore"}
                </button>
              ))}
            </div>
          )}
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "6px 0 0" }}>
            FCA compliance: AI suggestions require human sign-off before submission.
          </p>
        </div>
      )}
    </div>
  );
}
