"use client";

import { useState } from "react";
import { X, Mail, CheckCircle2, Loader2, Send } from "lucide-react";

interface AuditData {
  practiceName: string;
  dataRange: string;
  totalLeakage: number;
  expectedRecovery: number;
}

interface EmailReportModalProps {
  open: boolean;
  onClose: () => void;
  auditData?: AuditData | null;
}

type Step = "compose" | "sending" | "sent";

export function EmailReportModal({ open, onClose, auditData }: EmailReportModalProps) {
  const practiceName = auditData?.practiceName ?? "Riverview Family Medicine";
  const dataRange = auditData?.dataRange ?? "Jan 2026 – May 2026";
  const leakageK = Math.round((auditData?.totalLeakage ?? 83440) / 1000);
  const recoveryK = Math.round((auditData?.expectedRecovery ?? 51280) / 1000);
  const [step, setStep] = useState<Step>("compose");
  const [email, setEmail] = useState("");
  const [includeFindings, setIncludeFindings] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includePayerScorecard, setIncludePayerScorecard] = useState(true);

  if (!open) return null;

  const handleSend = async () => {
    if (!email.trim()) return;
    setStep("sending");
    await new Promise((r) => setTimeout(r, 1800));
    setStep("sent");
  };

  const handleClose = () => {
    setStep("compose");
    setEmail("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={step !== "sending" ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Email Audit Report</h2>
          </div>
          {step !== "sending" && (
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        {step === "compose" && (
          <div className="px-5 py-5 space-y-5">
            {/* Preview */}
            <div className="px-4 py-3 bg-secondary/60 rounded-lg border border-border space-y-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Report Preview</p>
              <p className="text-sm font-medium text-foreground">{practiceName} — Revenue Audit</p>
              <p className="text-xs text-muted-foreground">{dataRange} · ${leakageK}K leakage found · ${recoveryK}K recoverable</p>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Send to
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@riverview.com"
                className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                autoFocus
              />
            </div>

            {/* Sections to include */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Include in report</p>
              {[
                { label: "Recovery opportunities & dollar amounts", value: includeFindings, set: setIncludeFindings },
                { label: "Recommended actions by priority", value: includeActions, set: setIncludeActions },
                { label: "Payer scorecard (A–F grades)", value: includePayerScorecard, set: setIncludePayerScorecard },
              ].map(({ label, value, set }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <button
                    role="checkbox"
                    aria-checked={value}
                    onClick={() => set(!value)}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      value
                        ? "bg-primary border-primary"
                        : "border-border bg-background group-hover:border-primary/40"
                    }`}
                  >
                    {value && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                  </button>
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-[11px] text-muted-foreground">
              The report will be sent as a PDF attachment. No PHI is included — only aggregate financial findings.
            </p>
          </div>
        )}

        {step === "sending" && (
          <div className="px-5 py-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <p className="text-sm font-medium text-foreground">Sending report…</p>
            <p className="text-xs text-muted-foreground">Generating PDF and delivering to {email}</p>
          </div>
        )}

        {step === "sent" && (
          <div className="px-5 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Report sent to your inbox</p>
              <p className="text-xs text-muted-foreground mt-1">
                Delivered to <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>
            <div className="w-full px-4 py-3 bg-secondary/60 rounded-lg border border-border text-left space-y-1">
              <p className="text-xs font-medium text-foreground">What's in the email:</p>
              <ul className="space-y-0.5 mt-1">
                {includeFindings && <li className="text-[11px] text-muted-foreground">✓ Recovery opportunities (${leakageK}K leakage summary)</li>}
                {includeActions && <li className="text-[11px] text-muted-foreground">✓ Recommended actions by priority</li>}
                {includePayerScorecard && <li className="text-[11px] text-muted-foreground">✓ Payer scorecard with A–F grades</li>}
                <li className="text-[11px] text-muted-foreground">✓ Full PDF report attached</li>
              </ul>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Action footer */}
        {step === "compose" && (
          <div className="px-5 py-4 border-t border-border flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!email.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              Send Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
