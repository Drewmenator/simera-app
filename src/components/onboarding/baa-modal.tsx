"use client";

import { useState } from "react";
import { Shield, X, CheckCircle2, Download, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { acceptBaa } from "@/lib/api";

interface BaaModalProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
  organization?: string;
}

const BAA_POINTS = [
  "Simera will use PHI only to provide the Service",
  "PHI encrypted in transit (TLS 1.2+) and at rest (AES-256)",
  "Breach notification within 60 days",
  "PHI returned or destroyed upon termination",
  "Compliant with 45 CFR Parts 160 and 164",
];

export function BaaModal({ open, onAccept, onClose, organization }: BaaModalProps) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    setError(null);

    // Best-effort server-side record. We proceed regardless of outcome so a
    // missing baa_agreements table (migration 006 pending) never blocks the user.
    // The client records acceptance in localStorage immediately via onAccept().
    try {
      await acceptBaa({
        userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
        userName: user?.fullName ?? undefined,
        organization: organization,
      });
    } catch {
      // Server-side record failed — log and continue. The localStorage record
      // is the interim audit trail until migration 006 is run in Supabase.
      console.warn("[Simera] BAA server record failed — proceeding with localStorage record only.");
    } finally {
      setSaving(false);
    }

    // Always call onAccept regardless of API outcome
    onAccept();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0b2734",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo mark — teal square with notch, matching sidebar */}
            <div
              style={{
                width: 32,
                height: 32,
                background: "#14b8a6",
                borderRadius: 6,
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  background: "#0b2734",
                  borderTopLeftRadius: 4,
                }}
              />
            </div>
            <span
              style={{
                color: "#ffffff",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              SIMERA HEALTH
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              borderRadius: 4,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            background: "#ffffff",
            padding: "28px 24px 24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(20,184,166,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={22} color="#14b8a6" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0b2734",
                  fontFamily: "inherit",
                  lineHeight: 1.2,
                }}
              >
                Business Associate Agreement
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 12,
                  color: "#64748b",
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.04em",
                }}
              >
                HIPAA REQUIRED — BEFORE UPLOAD
              </p>
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#374151",
            }}
          >
            835 ERA files may contain Protected Health Information (PHI). Before uploading,
            you must execute a Business Associate Agreement (BAA) with Simera Health as
            required by HIPAA.
          </p>

          {/* Key points */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "16px 18px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.06em",
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Agreement Summary
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {BAA_POINTS.map((point) => (
                <li key={point} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircle2
                    size={16}
                    color="#14b8a6"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
              marginBottom: 20,
              padding: "12px 14px",
              border: `1.5px solid ${checked ? "#14b8a6" : "#e2e8f0"}`,
              borderRadius: 8,
              background: checked ? "rgba(20,184,166,0.04)" : "#ffffff",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{
                marginTop: 2,
                width: 16,
                height: 16,
                accentColor: "#14b8a6",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.55 }}>
              I have authority to execute this agreement on behalf of my organization and accept the BAA
            </span>
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <a
              href="mailto:compliance@simera.health?subject=BAA%20Execution%20Request"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                border: "1.5px solid #cbd5e1",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                textDecoration: "none",
                background: "#ffffff",
                fontFamily: "inherit",
                transition: "border-color 0.15s",
              }}
            >
              <Download size={14} />
              Request signed BAA
            </a>

            <button
              onClick={handleAccept}
              disabled={!checked || saving}
              style={{
                flex: 1,
                padding: "9px 16px",
                border: "none",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                color: checked && !saving ? "#ffffff" : "#94a3b8",
                background: checked && !saving ? "#14b8a6" : "#f1f5f9",
                cursor: checked && !saving ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {saving ? "Saving…" : "Accept & Continue"}
            </button>
          </div>

          {error && (
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#ef4444", textAlign: "center" }}>
              {error}
            </p>
          )}
          {/* Legal footnote */}
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Questions? Email{" "}
            <a
              href="mailto:compliance@simera.health"
              style={{ color: "#14b8a6", textDecoration: "none" }}
            >
              compliance@simera.health
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
