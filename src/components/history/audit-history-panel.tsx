"use client";

import { useEffect, useState } from "react";
import { History, X, Loader2, Clock } from "lucide-react";
import { listAuditHistory, getAuditById } from "@/lib/api";
import type { AuditResult, AuditRunSummary } from "@/lib/api";

interface AuditHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  /** Called when user selects an audit — passes the full result, the run ID, and a human-readable period string. */
  onSelectAudit: (result: AuditResult, auditId: string, period: string) => void;
  currentAuditId?: string;
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) return "Period unknown";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

function formatUploadDate(createdAt: string): string {
  const d = new Date(createdAt);
  return `Uploaded ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function AuditHistoryPanel({
  open,
  onClose,
  onSelectAudit,
  currentAuditId,
}: AuditHistoryPanelProps) {
  const [audits, setAudits] = useState<AuditRunSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listAuditHistory()
      .then(setAudits)
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelect = async (audit: AuditRunSummary) => {
    if (loadingId) return;
    setLoadingId(audit.id);
    try {
      const result = await getAuditById(audit.id);
      if (result) {
        onSelectAudit(result, audit.id, formatPeriod(audit.period_start, audit.period_end));
        onClose();
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 44,
          background: "rgba(11,39,52,0.35)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 340,
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          boxShadow: "-4px 0 32px rgba(11,39,52,0.18)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "18px 20px",
            background: "#0b2734",
            flexShrink: 0,
          }}
        >
          <History style={{ width: 18, height: 18, color: "#14b8a6", flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.01em",
            }}
          >
            Audit History
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                color: "#5c747e",
              }}
            >
              <Loader2
                style={{
                  width: 24,
                  height: 24,
                  animation: "spin 1s linear infinite",
                }}
              />
              <span style={{ fontSize: 13 }}>Loading history…</span>
            </div>
          ) : audits.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                padding: "0 24px",
                textAlign: "center",
              }}
            >
              <Clock style={{ width: 32, height: 32, color: "#d1dde0" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0b2734", margin: 0 }}>
                No past audits yet
              </p>
              <p style={{ fontSize: 13, color: "#5c747e", margin: 0, lineHeight: 1.5 }}>
                Upload your first 835 file to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {audits.map((audit) => {
                const isActive = audit.id === currentAuditId;
                const isLoadingThis = loadingId === audit.id;
                return (
                  <button
                    key={audit.id}
                    onClick={() => handleSelect(audit)}
                    disabled={!!loadingId}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: isActive
                        ? "1.5px solid rgba(20,184,166,0.35)"
                        : "1px solid rgba(11,39,52,0.09)",
                      background: isActive ? "rgba(20,184,166,0.05)" : "#fff",
                      cursor: loadingId ? "not-allowed" : "pointer",
                      textAlign: "left",
                      width: "100%",
                      position: "relative",
                      overflow: "hidden",
                      transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                      boxShadow: "0 1px 3px rgba(11,39,52,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      if (!loadingId) {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 4px 12px rgba(11,39,52,0.12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 1px 3px rgba(11,39,52,0.06)";
                    }}
                  >
                    {/* Teal rail for active item */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: "#14b8a6",
                          borderRadius: "3px 0 0 3px",
                        }}
                      />
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0b2734",
                          lineHeight: 1.2,
                        }}
                      >
                        {audit.practice_name}
                      </span>
                      {isLoadingThis && (
                        <Loader2
                          style={{
                            width: 13,
                            height: 13,
                            color: "#14b8a6",
                            flexShrink: 0,
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isActive && !isLoadingThis && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#0c8174",
                            background: "rgba(20,184,166,0.12)",
                            padding: "2px 7px",
                            borderRadius: 20,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            flexShrink: 0,
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: 12.5, color: "#2a6f97", fontWeight: 500 }}>
                      {formatPeriod(audit.period_start, audit.period_end)}
                    </span>

                    <span style={{ fontSize: 11.5, color: "#8aa0a8" }}>
                      {formatUploadDate(audit.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
