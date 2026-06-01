"use client";

import { useState } from "react";
import { FlaskConical, X, CheckCircle2 } from "lucide-react";
import { useAuditContext } from "@/lib/audit-context";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { result } = useAuditContext();

  // Live mode
  if (result) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "18px 34px 0",
          padding: "11px 16px",
          borderRadius: 12,
          background: "#e4f4f1",
          border: "1px solid rgba(12,129,116,0.3)",
          color: "#0a5c52",
          fontSize: 13.5,
          flexShrink: 0,
        }}
      >
        <CheckCircle2 style={{ flexShrink: 0, width: 18, height: 18, color: "#0c8174" }} />
        <p>
          <b style={{ color: "#064a42", fontWeight: 700 }}>Live data</b>
          {" — showing your actual 835 results for "}
          <b style={{ color: "#064a42", fontWeight: 700 }}>{result.practice_name}</b>
          {". Dashboard updated with your real numbers."}
        </p>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "18px 34px 0",
        padding: "11px 16px",
        borderRadius: 12,
        background: "#f8efdd",
        border: "1px solid rgba(189,133,47,0.3)",
        color: "#7a5414",
        fontSize: 13.5,
        flexShrink: 0,
      }}
    >
      <FlaskConical style={{ flexShrink: 0, width: 18, height: 18, color: "#bd852f" }} />
      <p style={{ flex: 1 }}>
        <b style={{ color: "#5e3f0c", fontWeight: 700 }}>Demo mode</b>
        {" — showing sample data for Riverview Family Medicine (4-physician family practice, Jan–May 2026). Upload your own 835 files to see your real numbers."}
      </p>
      <button
        onClick={() => setDismissed(true)}
        style={{
          marginLeft: "auto",
          color: "#a07a2e",
          fontSize: 18,
          lineHeight: 1,
          padding: "2px 6px",
          borderRadius: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Dismiss"
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}
