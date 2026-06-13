"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Calendly inline widget URL — configure via NEXT_PUBLIC_CALENDLY_URL env var
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

// Declare the global Calendly embed helper that the inline widget script provides
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: { url: string; parentElement: Element | null }) => void;
    };
  }
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const F = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const NAVY = "#0b2734";
const TEAL = "#14b8a6";

// ─ Logo ───────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: TEAL, position: "relative", flexShrink: 0, boxShadow: `0 4px 12px -2px ${TEAL}80` }}>
        <div style={{ position: "absolute", inset: "10px 10px auto auto", width: 12, height: 12, borderRadius: 3, background: NAVY }} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaf2f3", fontFamily: F }}>simera</div>
        <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 500, letterSpacing: "0.18em", color: TEAL, textTransform: "uppercase", marginTop: 1 }}>health</div>
      </div>
    </div>
  );
}

// ─ Demo agenda item ───────────────────────────────────────────────────────────
function AgendaItem({ time, title, body }: { time: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ flexShrink: 0, width: 48, paddingTop: 2 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: TEAL, letterSpacing: "0.05em" }}>{time}</span>
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#eaf2f3", margin: "0 0 3px" }}>{title}</p>
        <p style={{ fontSize: 13, color: "#8fabb5", lineHeight: 1.55, margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

// ── Contact form ──────────────────────────────────────────────────────────────
type FormData = {
  name: string;
  email: string;
  practice: string;
  specialty: string;
  providers: string;
  message: string;
};

const SPECIALTIES = [
  "Family Medicine", "Internal Medicine", "Pediatrics", "Cardiology",
  "Orthopedics", "Dermatology", "Gastroenterology", "Psychiatry",
  "Urgent Care", "Other",
];

const PROVIDER_COUNTS = ["1", "2–5", "6–10", "11–25", "25+"];

function inputSt(val: string): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${val ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 9,
    color: "#eaf2f3",
    fontSize: 14,
    fontFamily: F,
    outline: "none",
    transition: "border-color 0.15s",
  };
}

export default function BookDemoPage() {
  const [form, setForm] = useState<FormData>({
    name: "", email: "", practice: "", specialty: "", providers: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendlyReady, setCalendlyReady] = useState(false);

  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const valid = form.name.trim() && form.email.includes("@") && form.practice.trim() && form.specialty && form.providers;

  // Load Calendly inline widget script once, after mount
  useEffect(() => {
    if (!CALENDLY_URL) return;
    const existing = document.getElementById("calendly-embed-script");
    if (existing) {
      setCalendlyReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "calendly-embed-script";
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setCalendlyReady(true);
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(link);
  }, []);

  // After the Calendly widget container renders, init the inline widget
  useEffect(() => {
    if (!submitted || !CALENDLY_URL || !calendlyReady) return;
    const el = document.getElementById("calendly-inline-container");
    if (!el || !window.Calendly) return;

    // Build pre-fill URL: name + email from form, custom UTM params
    const base = CALENDLY_URL.includes("?") ? CALENDLY_URL : `${CALENDLY_URL}`;
    const params = new URLSearchParams({
      name: form.name,
      email: form.email,
      a1: form.practice,       // Calendly custom question 1 → practice name
      hide_event_type_details: "1",
      hide_gdpr_banner: "1",
      primary_color: "14b8a6",
    });
    window.Calendly.initInlineWidget({
      url: `${base}?${params.toString()}`,
      parentElement: el,
    });
  }, [submitted, calendlyReady, form.name, form.email, form.practice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);

    try {
      // Fire-and-forget lead notification (best effort — never blocks the UX)
      fetch("mailto:hello@simerahealth.org", { method: "GET" }).catch(() => null);

      // Notify via email if a contact endpoint is available
      await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          practice: form.practice,
          specialty: form.specialty,
          providers: form.providers,
          message: form.message,
        }),
      }).catch(() => null); // graceful: never block on API failure
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div style={{ background: NAVY, minHeight: "100vh", fontFamily: F }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <Link href="/waitlist" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <Link href="/sign-in" style={{ fontSize: 13.5, color: "#8fabb5", textDecoration: "none", fontWeight: 500 }}>
          Sign in →
        </Link>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 32px 80px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 56 }}>

        {/* Left column — agenda + context */}
        <div>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, marginBottom: 12 }}>Book a demo</p>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 16px" }}>
            See your practice&apos;s<br />
            <span style={{ color: TEAL }}>real numbers</span> — live.
          </h1>
          <p style={{ fontSize: 15, color: "#8fabb5", lineHeight: 1.65, maxWidth: "42ch", marginBottom: 40 }}>
            30-minute walkthrough. We run a live audit on a sample 835 file, show you exactly where revenue is leaking, and generate your first appeal letter in real time.
          </p>

          {/* Demo agenda */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 14, padding: "24px 24px",
            marginBottom: 36,
          }}>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c747e", marginBottom: 20 }}>
              What to expect (30 min)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <AgendaItem time="0:00" title="Your practice, your numbers" body="We pull up Simera together. You upload a real 835 (or we use a sample) and watch the audit run in under 60 seconds." />
              <AgendaItem time="8:00" title="Finding walkthrough" body="We go through every denial cluster, underpayment, and wrong write-off found — ranked by dollar impact and recovery probability." />
              <AgendaItem time="18:00" title="Live appeal letter" body="Pick any denial. We generate the AI appeal letter in front of you — CARC-specific arguments, documentation checklist, the works." />
              <AgendaItem time="25:00" title="Q&A + pricing" body="Any questions about compliance, EHR integrations, team access, or fit for your practice. We&apos;re direct about what Simera is good at." />
            </div>
          </div>

          {/* Social proof */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { stat: "< 60s", label: "from 835 upload to first finding" },
              { stat: "$31K", label: "median monthly recovery opportunity found in beta" },
              { stat: "0 PHI", label: "stored after processing — HIPAA-compliant" },
            ].map(({ stat, label }) => (
              <div key={stat} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: TEAL, minWidth: 52 }}>{stat}</span>
                <span style={{ fontSize: 13.5, color: "#8fabb5" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — form */}
        <div>
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16, padding: "28px 24px",
          }}>
            {submitted ? (
              CALENDLY_URL ? (
                /* ── Calendly inline scheduling widget ── */
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "14px 16px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "rgba(20,184,166,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#eaf2f3", margin: 0 }}>Info received — pick a time</p>
                      <p style={{ fontSize: 11, color: "#8fabb5", margin: 0 }}>Your name and email are pre-filled below</p>
                    </div>
                  </div>
                  {/* Calendly populates this div after initInlineWidget() */}
                  <div
                    id="calendly-inline-container"
                    style={{ minHeight: 630, borderRadius: "0 0 16px 16px", overflow: "hidden" }}
                  />
                </div>
              ) : (
                /* ── Fallback success message (no Calendly URL configured) ── */
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: "rgba(20,184,166,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#eaf2f3", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                    Request sent!
                  </h2>
                  <p style={{ fontSize: 14, color: "#8fabb5", lineHeight: 1.6, margin: "0 0 24px" }}>
                    We&apos;ll reach out within 24 hours to schedule your demo.
                  </p>
                  <Link
                    href="/waitlist"
                    style={{
                      display: "inline-block", padding: "10px 20px",
                      background: "rgba(255,255,255,0.07)", borderRadius: 8,
                      color: "#eaf2f3", fontSize: 13.5, fontWeight: 600,
                      textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    ← Back to Simera
                  </Link>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5c747e", marginBottom: 16 }}>
                    Request a demo
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 5, letterSpacing: "0.04em" }}>Your name *</label>
                    <input
                      style={inputSt(form.name)}
                      placeholder="Dr. Jane Smith"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 5, letterSpacing: "0.04em" }}>Work email *</label>
                    <input
                      style={inputSt(form.email)}
                      type="email"
                      placeholder="jane@practice.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 5, letterSpacing: "0.04em" }}>Practice name *</label>
                  <input
                    style={inputSt(form.practice)}
                    placeholder="Riverside Family Medicine"
                    value={form.practice}
                    onChange={(e) => set("practice", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 8, letterSpacing: "0.04em" }}>Specialty *</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set("specialty", s)}
                        style={{
                          padding: "5px 12px", borderRadius: 20,
                          border: `1px solid ${form.specialty === s ? TEAL : "rgba(255,255,255,0.15)"}`,
                          background: form.specialty === s ? "rgba(20,184,166,0.15)" : "transparent",
                          color: form.specialty === s ? TEAL : "#8fabb5",
                          fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                          transition: "all 0.12s", fontFamily: F,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 8, letterSpacing: "0.04em" }}>Number of providers *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {PROVIDER_COUNTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set("providers", p)}
                        style={{
                          flex: 1, padding: "8px 4px", borderRadius: 9,
                          border: `1px solid ${form.providers === p ? TEAL : "rgba(255,255,255,0.15)"}`,
                          background: form.providers === p ? "rgba(20,184,166,0.15)" : "transparent",
                          color: form.providers === p ? TEAL : "#8fabb5",
                          fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                          transition: "all 0.12s", fontFamily: MONO,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#8fabb5", marginBottom: 5, letterSpacing: "0.04em" }}>Anything you&apos;d like us to focus on?</label>
                  <textarea
                    style={{ ...inputSt(form.message), minHeight: 80, resize: "vertical" }}
                    placeholder="e.g. We see a lot of CO-97 denials from UHC, want to understand win rates..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!valid || submitting}
                  style={{
                    width: "100%", padding: "13px 20px",
                    borderRadius: 10, border: "none",
                    background: valid && !submitting ? TEAL : "rgba(255,255,255,0.08)",
                    color: valid && !submitting ? "#fff" : "#5c747e",
                    fontSize: 15, fontWeight: 700, cursor: valid && !submitting ? "pointer" : "not-allowed",
                    fontFamily: F, letterSpacing: "-0.01em",
                    transition: "background 0.15s, color 0.15s",
                    boxShadow: valid && !submitting ? `0 4px 20px -4px ${TEAL}60` : "none",
                  }}
                >
                  {submitting ? "Sending…" : "Request demo →"}
                </button>

                <p style={{ fontSize: 11, color: "#3a5460", textAlign: "center", margin: 0 }}>
                  We&apos;ll respond within 24 hours.{" "}
                  <a href="mailto:hello@simerahealth.org" style={{ color: TEAL, textDecoration: "none" }}>
                    Or email us directly.
                  </a>
                </p>
              </form>
            )}
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            {[
              { icon: "🛡", text: "HIPAA-compliant architecture" },
              { icon: "🔒", text: "No PHI stored after audit" },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                flex: 1, display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 9, padding: "10px 12px",
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 11.5, color: "#8fabb5" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Logo />
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/trust" style={{ fontSize: 12.5, color: "#5c747e", textDecoration: "none" }}>Trust & Security</Link>
          <Link href="/waitlist" style={{ fontSize: 12.5, color: "#5c747e", textDecoration: "none" }}>Home</Link>
          <Link href="/sign-in" style={{ fontSize: 12.5, color: "#5c747e", textDecoration: "none" }}>Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
