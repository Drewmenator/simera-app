"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, X, Copy, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { generateAppealLetter } from "@/lib/api";
import { generateAppealLetter as generateLocalLetter } from "@/lib/evidence-engine";

interface AppealLetterModalProps {
  open: boolean;
  onClose: () => void;
  finding: {
    label: string;
    payer: string;
    denialCodes: string[];
    dollarAmount: number;
    expectedRecovery: number;
    description: string;
    action: string;
    cptCodes: string[];
  } | null;
  practiceName: string;
}

type ModalState = "generating" | "ready" | "error";

export function AppealLetterModal({ open, onClose, finding, practiceName }: AppealLetterModalProps) {
  const { getToken } = useAuth();
  const [state, setState] = useState<ModalState>("generating");
  const [letter, setLetter] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const generate = useCallback(async () => {
    if (!finding) return;
    setState("generating");
    setError("");
    setIsLocalFallback(false);
    try {
      const result = await generateAppealLetter({
        finding_label: finding.label,
        payer_name: finding.payer,
        denial_codes: finding.denialCodes,
        dollar_amount: finding.dollarAmount,
        expected_recovery: finding.expectedRecovery,
        description: finding.description,
        recommended_action: finding.action,
        practice_name: practiceName,
        cpt_codes: finding.cptCodes,
      }, getToken);
      setLetter(result.letter);
      setSubjectLine(result.subject_line);
      setState("ready");
    } catch (err) {
      // Try local template fallback before showing error
      if (finding) {
        try {
          const localLetter = generateLocalLetter({
            practiceName,
            payerName: finding.payer,
            carcCode: finding.denialCodes[0] ?? "unknown",
            claimIds: [],
            cptCodes: finding.cptCodes,
            dollarAmount: finding.dollarAmount,
          });
          setLetter(localLetter);
          setSubjectLine(
            finding.denialCodes[0]
              ? `Appeal — ${finding.payer} — CARC ${finding.denialCodes[0]}`
              : `Payment Dispute — ${finding.payer} — ${finding.label}`
          );
          setIsLocalFallback(true);
          setState("ready");
        } catch {
          setError(err instanceof Error ? err.message : "Unknown error");
          setState("error");
        }
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
        setState("error");
      }
    }
  }, [finding, practiceName, getToken]);

  useEffect(() => {
    if (open && finding) {
      generate();
    }
  }, [open, finding]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function handleCopy() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const payerSlug = (finding?.payer ?? "payer").replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase();
    a.download = `appeal-${payerSlug}-${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,39,52,0.48)",
        backdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 8px 40px rgba(11,39,52,0.28), 0 2px 8px rgba(11,39,52,0.12)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0b2734",
            padding: "18px 22px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(20,184,166,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <FileText style={{ width: 18, height: 18, color: "#14b8a6" }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {state === "generating"
                ? (finding?.denialCodes.length === 0 ? "Generating Dispute Letter" : "Generating Appeal Letter")
                : state === "error"
                ? "Letter — Error"
                : `${finding?.denialCodes.length === 0 ? "Dispute Letter" : "Appeal Letter"} — ${finding?.payer}`}
            </h2>
            {state === "ready" && subjectLine && (
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11.5,
                  color: "#14b8a6",
                  marginTop: 5,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {subjectLine}
              </p>
            )}
          </div>

          {/* Header action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {state === "ready" && (
              <>
                <button
                  onClick={handleCopy}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: copied ? "rgba(20,184,166,0.2)" : "rgba(20,184,166,0.1)",
                    color: "#14b8a6",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Copy style={{ width: 13, height: 13 }} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.1)",
                    color: "#14b8a6",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <Download style={{ width: 13, height: 13 }} />
                  Download .txt
                </button>
                <button
                  onClick={() => {
                    // Open a new window with the letter formatted for printing
                    const win = window.open("", "_blank");
                    if (win) {
                      win.document.write(`
                        <html><head><title>Appeal Letter — ${finding?.payer ?? ""}</title>
                        <style>
                          body { font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.7; padding: 48px; max-width: 720px; margin: 0 auto; color: #111; }
                          h1 { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
                          p { margin: 0; }
                          @media print { body { padding: 0; } }
                        </style>
                        </head><body>
                        <pre style="white-space:pre-wrap;font-family:inherit">${letter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
                        <script>window.onload = () => { window.print(); }<\/script>
                        </body></html>
                      `);
                      win.document.close();
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(20,184,166,0.4)",
                    background: "rgba(20,184,166,0.1)",
                    color: "#14b8a6",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🖨 Print / PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* Progress bar — generating */}
        {state === "generating" && (
          <div style={{ height: 3, background: "rgba(11,39,52,0.08)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "#14b8a6",
                animation: "simera-indeterminate 1.4s ease-in-out infinite",
                width: "40%",
              }}
            />
            <style>{`
              @keyframes simera-indeterminate {
                0%   { transform: translateX(-100%) scaleX(0.6); }
                50%  { transform: translateX(100%) scaleX(1.2); }
                100% { transform: translateX(250%) scaleX(0.6); }
              }
            `}</style>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {state === "generating" && (
            <div
              style={{
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0b2734" }}>
                Drafting your appeal letter for {finding?.payer}...
              </p>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: "#8aa0a8",
                }}
              >
                This takes about 10 seconds
              </p>
            </div>
          )}

          {state === "error" && (
            <div
              style={{
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 14, color: "#c2553d", fontWeight: 600 }}>
                Failed to generate appeal letter
              </p>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: "#8aa0a8",
                  maxWidth: "40ch",
                }}
              >
                {error}
              </p>
              <button
                onClick={generate}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(20,184,166,0.4)",
                  background: "rgba(20,184,166,0.08)",
                  color: "#0c8174",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw style={{ width: 13, height: 13 }} />
                Retry
              </button>
            </div>
          )}

          {state === "ready" && (
            <div style={{ padding: "0 0 0 0", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
              {isLocalFallback && (
                <div style={{
                  padding: "8px 16px",
                  background: "#f8efdd",
                  borderBottom: "1px solid rgba(189,133,47,0.2)",
                  fontSize: 12,
                  color: "#9a6a1e",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span>⚡</span>
                  Template letter — AI generation unavailable · Personalize before sending
                </div>
              )}
              <pre
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#0b2734",
                  background: "#fff",
                  padding: 24,
                  margin: 0,
                  maxHeight: 420,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  flex: 1,
                }}
              >
                {letter}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        {state === "ready" && (
          <div
            style={{
              padding: "13px 24px",
              borderTop: "1px solid rgba(11,39,52,0.08)",
              background: "#f9fbfb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: "#8aa0a8",
                lineHeight: 1.5,
              }}
            >
              Review before sending. No PHI included — this covers the aggregate denial pattern.
            </p>
            <button
              onClick={onClose}
              style={{
                height: 32,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid rgba(11,39,52,0.14)",
                background: "#fff",
                color: "#5c747e",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
