"use client";

import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ParseResult, ValidationCheck } from "@/lib/parse-835";

interface ValidatorStepProps {
  fileName: string;
  result: ParseResult;
  onProceed: () => void;
  onBack: () => void;
}

function StatusIcon({ status }: { status: ValidationCheck["status"] }) {
  if (status === "pass") return <CheckCircle2 style={{ width: 14, height: 14, color: "#0c8174", flexShrink: 0 }} />;
  if (status === "fail") return <XCircle      style={{ width: 14, height: 14, color: "#c2553d", flexShrink: 0 }} />;
  if (status === "warn") return <AlertTriangle style={{ width: 14, height: 14, color: "#c89020", flexShrink: 0 }} />;
  return <MinusCircle style={{ width: 14, height: 14, color: "#b0c4ca", flexShrink: 0 }} />;
}

function statusColor(status: ValidationCheck["status"]): string {
  if (status === "pass") return "#0b2734";
  if (status === "fail") return "#c2553d";
  if (status === "warn") return "#9a6a1e";
  return "#8aa0a8";
}

function fmtDate(raw?: string): string {
  if (!raw || raw.length !== 8) return raw ?? "—";
  return `${raw.slice(4, 6)}/${raw.slice(6, 8)}/${raw.slice(0, 4)}`;
}

export function ValidatorStep({ fileName, result, onProceed, onBack }: ValidatorStepProps) {
  const [expanded, setExpanded] = useState(false);

  // Split into prominent (fail/warn) and background (pass/skip)
  const prominent = result.checks.filter(c => c.status === "fail" || c.status === "warn");
  const background = result.checks.filter(c => c.status === "pass" || c.status === "skip");

  // Determine overall status
  const statusLabel = result.valid
    ? result.warnCount === 0
      ? "File looks great"
      : `Valid with ${result.warnCount} advisory note${result.warnCount !== 1 ? "s" : ""}`
    : `${result.errorCount} error${result.errorCount !== 1 ? "s" : ""} — review before submitting`;

  const headerBg = result.valid
    ? result.warnCount === 0
      ? "linear-gradient(90deg, #0c8174 0%, #0a6b61 100%)"
      : "linear-gradient(90deg, #c89020 0%, #a87318 100%)"
    : "linear-gradient(90deg, #c2553d 0%, #a84230 100%)";

  const headerIcon = result.valid
    ? result.warnCount === 0
      ? <CheckCircle2 style={{ width: 20, height: 20, color: "#fff" }} />
      : <AlertTriangle style={{ width: 20, height: 20, color: "#fff" }} />
    : <XCircle style={{ width: 20, height: 20, color: "#fff" }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Status banner */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(11,39,52,0.10)" }}>
        <div style={{ background: headerBg, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          {headerIcon}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              {statusLabel}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.78)", margin: "2px 0 0" }}>
              {fileName}
            </p>
          </div>
        </div>

        {/* Preview stats — only shown when parseable */}
        {(result.payerName || result.claimCount !== undefined || result.totalPaid !== undefined || result.paymentDate) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 0,
            background: "#f9fbfb",
            borderTop: "1px solid rgba(11,39,52,0.07)",
          }}>
            {[
              { label: "Payer",          value: result.payerName ?? "—" },
              { label: "Payment date",   value: fmtDate(result.paymentDate) },
              { label: "Claims",         value: result.claimCount != null ? result.claimCount.toLocaleString() : "—" },
              { label: "Total paid",     value: result.totalPaid != null
                  ? `$${result.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—" },
            ].map(({ label, value }, i) => (
              <div key={label} style={{
                padding: "10px 14px",
                borderRight: i % 2 === 0 ? "1px solid rgba(11,39,52,0.07)" : "none",
                borderTop: i >= 2 ? "1px solid rgba(11,39,52,0.07)" : "none",
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8aa0a8", margin: "0 0 3px" }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0b2734", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues — show fail/warn prominently */}
      {prominent.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {prominent.map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "9px 12px", borderRadius: 9,
              background: c.status === "fail" ? "rgba(194,85,61,0.08)" : "rgba(200,144,32,0.08)",
              border: c.status === "fail" ? "1px solid rgba(194,85,61,0.22)" : "1px solid rgba(200,144,32,0.22)",
            }}>
              <StatusIcon status={c.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: statusColor(c.status), margin: 0 }}>{c.label}</p>
                {c.detail && <p style={{ fontSize: 11.5, color: "#7a8e96", margin: "2px 0 0", lineHeight: 1.4 }}>{c.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible — all checks */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 0", color: "#5c747e", fontSize: 12,
        }}
      >
        {expanded
          ? <><ChevronUp style={{ width: 13, height: 13 }} /> Hide all {result.checks.length} checks</>
          : <><ChevronDown style={{ width: 13, height: 13 }} /> Show all {result.checks.length} checks ({background.length} passed)</>
        }
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {result.checks.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 10px", borderRadius: 7, background: "rgba(11,39,52,0.03)" }}>
              <StatusIcon status={c.status} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: statusColor(c.status), margin: 0 }}>{c.label}</p>
                {c.detail && <p style={{ fontSize: 11, color: "#8aa0a8", margin: "1px 0 0" }}>{c.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
        <button
          onClick={onBack}
          style={{
            padding: "9px 16px", borderRadius: 9,
            border: "1px solid rgba(11,39,52,0.12)",
            background: "none", color: "#5c747e",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <button
          onClick={onProceed}
          style={{
            flex: 1, padding: "9px 16px", borderRadius: 9,
            background: result.valid ? "#14b8a6" : "rgba(194,85,61,0.85)",
            color: "#fff", border: "none",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          {result.valid
            ? result.warnCount === 0
              ? "Submit for analysis →"
              : `Submit with ${result.warnCount} warning${result.warnCount !== 1 ? "s" : ""} →`
            : "Submit anyway (not recommended) →"}
        </button>
      </div>

      {!result.valid && (
        <p style={{ fontSize: 11, color: "#c2553d", textAlign: "center", margin: "-8px 0 0" }}>
          Hard errors found. The API may reject this file. Fix and re-upload, or proceed at your own risk.
        </p>
      )}
    </div>
  );
}
