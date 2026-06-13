"use client";

import { useState, useEffect } from "react";
import { Upload, TrendingDown, TrendingUp, ArrowRight, Sparkles, X, BarChart2, Zap, FlaskConical, CheckCircle2 } from "lucide-react";
import { useAuditContext } from "@/lib/audit-context";

interface WelcomeOverlayProps {
  onUploadClick: () => void;
}

// ── Empty-state: choose upload or sample ─────────────────────────────────────

function GetStartedScreen({
  onUpload,
  onSample,
}: {
  onUpload: () => void;
  onSample: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(11,39,52,0.72)", backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px -8px rgba(11,39,52,0.32)", width: "100%", maxWidth: 480, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "#0b2734", padding: "28px 32px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#14b8a6", position: "relative", flexShrink: 0, boxShadow: "0 4px 12px -2px rgba(20,184,166,0.5)" }}>
              <div style={{ position: "absolute", inset: "10px 10px auto auto", width: 12, height: 12, borderRadius: 3, background: "#0b2734" }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaf2f3" }}>simera</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", color: "#14b8a6", textTransform: "uppercase", marginTop: 2 }}>health</div>
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaf2f3", margin: "0 0 8px" }}>
            Find the revenue you&apos;re owed
          </h1>
          <p style={{ fontSize: 14, color: "#8fabb5", lineHeight: 1.5, margin: 0 }}>
            Upload your 835 ERA files and Simera will analyze every claim, denial, and underpayment — and show you exactly how to recover it.
          </p>
        </div>

        {/* Feature bullets */}
        <div style={{ padding: "24px 32px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: TrendingDown, color: "#c2553d", bg: "#f8e8e3", title: "Revenue leakage detection", body: "Unworked denials, underpayments, and wrong write-offs surfaced in seconds." },
              { icon: BarChart2,    color: "#0c8174", bg: "#e4f4f1", title: "Payer-by-payer scorecard",   body: "See which insurers are your worst performers and by how much." },
              { icon: Sparkles,    color: "#7c5cbf", bg: "#f0ebfa", title: "Ask Simera anything",          body: "\"What's the fastest $10K I can recover?\" — answered in plain English." },
            ].map(({ icon: Icon, color, bg, title, body }) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 17, height: 17, color }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", margin: "0 0 2px" }}>{title}</p>
                  <p style={{ fontSize: 13, color: "#5c747e", lineHeight: 1.4, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding: "24px 32px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onUpload}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              width: "100%", padding: "14px 20px", borderRadius: 12,
              background: "#14b8a6", color: "#fff", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
              boxShadow: "0 4px 16px -4px rgba(20,184,166,0.5)",
            }}
          >
            <Upload style={{ width: 17, height: 17 }} />
            Upload your 835 file
          </button>

          {/* Sample audit CTA — distinct, compelling */}
          <button
            onClick={onSample}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              width: "100%", padding: "12px 20px", borderRadius: 12,
              background: "rgba(11,39,52,0.05)", color: "#0b2734",
              border: "1.5px solid rgba(11,39,52,0.14)", cursor: "pointer",
              fontSize: 14, fontWeight: 600,
            }}
          >
            <FlaskConical style={{ width: 15, height: 15, color: "#2a6f97" }} />
            See a live audit on sample data first
          </button>

          <p style={{ textAlign: "center", fontSize: 11, color: "#8aa0a8", margin: "2px 0 0" }}>
            Sample uses Riverview Family Medicine — a fictional practice. No PHI.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sample audit "loading" screen ─────────────────────────────────────────────

const SAMPLE_STEPS = [
  "Parsing 835 EDI segments…",
  "Identifying denial clusters by CARC code…",
  "Calculating underpayment variance…",
  "Scoring recovery probability per finding…",
  "Building appeal intelligence packages…",
];

function SampleAuditLoading({ onReady }: { onReady: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (stepIdx < SAMPLE_STEPS.length - 1) {
      const t = setTimeout(() => setStepIdx((i) => i + 1), 480);
      return () => clearTimeout(t);
    } else {
      // All steps done — reveal the dashboard
      const t = setTimeout(onReady, 600);
      return () => clearTimeout(t);
    }
  }, [stepIdx, onReady]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(11,39,52,0.80)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 24px 64px -8px rgba(11,39,52,0.32)", width: "100%", maxWidth: 400, overflow: "hidden" }}>

        <div style={{ background: "#0b2734", padding: "24px 28px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#14b8a6", margin: "0 0 6px" }}>Sample Audit</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#eaf2f3", margin: 0, letterSpacing: "-0.02em" }}>
            Riverview Family Medicine
          </p>
          <p style={{ fontSize: 13, color: "#8fabb5", margin: "4px 0 0" }}>835 ERA — May 2026 · Synthetic data</p>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Progress steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {SAMPLE_STEPS.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: i < stepIdx ? "#14b8a6" : i === stepIdx ? "rgba(20,184,166,0.15)" : "rgba(11,39,52,0.07)",
                  border: i === stepIdx ? "2px solid #14b8a6" : "none",
                  transition: "all 0.3s ease",
                }}>
                  {i < stepIdx ? (
                    <CheckCircle2 style={{ width: 12, height: 12, color: "#fff" }} />
                  ) : i === stepIdx ? (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6", animation: "pulse 1s ease-in-out infinite" }} />
                  ) : null}
                </div>
                <p style={{
                  fontSize: 13, margin: 0,
                  color: i <= stepIdx ? "#0b2734" : "#b0c4ca",
                  fontWeight: i === stepIdx ? 600 : 400,
                  transition: "all 0.3s ease",
                }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "rgba(11,39,52,0.08)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", background: "#14b8a6", borderRadius: 4,
              width: `${((stepIdx + 1) / SAMPLE_STEPS.length) * 100}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature tour (after real upload) ─────────────────────────────────────────

const TOUR_STEPS = [
  {
    icon: TrendingDown,
    iconColor: "#c2553d",
    iconBg: "#f8e8e3",
    title: "We analyzed your 835 data",
    body: "Simera found revenue being silently left behind through denied claims, underpayments, and wrong write-offs. Every finding is ranked by recovery probability.",
  },
  {
    icon: Zap,
    iconColor: "#0c8174",
    iconBg: "#e4f4f1",
    title: "Each item has an action attached",
    body: "Not just a number — the exact appeal language, payer contact, and deadline so your billing team can act today, not next quarter.",
  },
  {
    icon: Sparkles,
    iconColor: "#7c5cbf",
    iconBg: "#f0ebfa",
    title: "Ask Simera anything about your data",
    body: "\"Why is UHC denying my prior auth claims?\" \"Which payer is worth negotiating?\" — Simera knows your 835 data and answers in plain English.",
  },
];

function FeatureTour({ onDismiss, practiceName, leakage, recovery }: {
  onDismiss: () => void;
  practiceName: string;
  leakage: number;
  recovery: number;
}) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(11,39,52,0.60)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 24px 64px -8px rgba(11,39,52,0.28)", width: "100%", maxWidth: 380, overflow: "hidden", position: "relative" }}>

        <button onClick={onDismiss} aria-label="Skip tour" style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#8aa0a8", padding: 4, borderRadius: 6, display: "flex" }}>
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div style={{ display: "flex", gap: 5, padding: "18px 22px 0" }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ height: 3, borderRadius: 2, transition: "all 0.25s", flex: i === step ? 2 : 1, background: i <= step ? "#14b8a6" : "rgba(11,39,52,0.10)" }} />
          ))}
        </div>

        <div style={{ padding: "18px 22px 22px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: current.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon style={{ width: 22, height: 22, color: current.iconColor }} />
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: "#0b2734", margin: "0 0 8px" }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 14, color: "#5c747e", lineHeight: 1.6, margin: 0 }}>{current.body}</p>

          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <div style={{ background: "#f8e8e3", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c2553d", margin: "0 0 4px" }}>Leakage found</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#0b2734", margin: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(leakage)}</p>
              </div>
              <div style={{ background: "#e4f4f1", borderRadius: 10, padding: "12px 14px" }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0c8174", margin: "0 0 4px" }}>Recoverable</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#0b2734", margin: 0, fontVariantNumeric: "tabular-nums" }}>{fmt(recovery)}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
              {["What's the fastest $10K I can recover?", "Which payer is the most profitable?", "What should I focus on this month?"].map((q) => (
                <div key={q} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f6f8f8", borderRadius: 8, padding: "8px 12px" }}>
                  <Sparkles style={{ width: 12, height: 12, color: "#7c5cbf", flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: "#0b2734", margin: 0 }}>{q}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "0 22px 22px", display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(11,39,52,0.12)", background: "none", fontSize: 14, color: "#5c747e", cursor: "pointer", fontWeight: 500 }}>
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? onDismiss() : setStep(step + 1)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 16px", borderRadius: 10, background: "#14b8a6", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
          >
            {isLast ? `Explore ${practiceName}` : "Next"}
            <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ paddingBottom: 16, textAlign: "center" }}>
          <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#8aa0a8" }}>
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function WelcomeOverlay({ onUploadClick }: WelcomeOverlayProps) {
  const { result, isLoading } = useAuditContext();
  const [state, setState] = useState<"idle" | "get-started" | "sample-loading" | "tour" | "done">("idle");

  useEffect(() => {
    if (isLoading) return;
    const seen = sessionStorage.getItem("simera_onboarded");
    if (seen) { setState("done"); return; }
    if (!result) {
      setState("get-started");
    } else {
      const t = setTimeout(() => setState("tour"), 500);
      return () => clearTimeout(t);
    }
  }, [isLoading, result]);

  const dismiss = () => {
    sessionStorage.setItem("simera_onboarded", "1");
    setState("done");
  };

  const handleUpload = () => {
    dismiss();
    onUploadClick();
  };

  // "See a live audit on sample data" — play the fake audit animation,
  // then reveal the dashboard (which already has mock/demo data).
  const handleSampleDemo = () => {
    setState("sample-loading");
  };

  const handleSampleReady = () => {
    dismiss(); // marks onboarded, reveals dashboard with demo data
  };

  if (state === "get-started") {
    return <GetStartedScreen onUpload={handleUpload} onSample={handleSampleDemo} />;
  }

  if (state === "sample-loading") {
    return <SampleAuditLoading onReady={handleSampleReady} />;
  }

  if (state === "tour" && result) {
    return (
      <FeatureTour
        onDismiss={dismiss}
        practiceName={result.practice_name}
        leakage={result.headline.total_leakage}
        recovery={result.headline.expected_recovery}
      />
    );
  }

  return null;
}
