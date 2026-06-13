import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simera Health — Get paid what you earned",
  description:
    "AI-powered revenue intelligence for independent physician practices. Find every denied claim, underpayment, and wrong write-off in your 835 ERA files — and get the exact appeals that get you paid.",
};

// ── Primitives ────────────────────────────────────────────────────────────────

const F = "'Hanken Grotesk', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const NAVY = "#0b2734";
const TEAL = "#14b8a6";
const TEAL_DARK = "#0c8174";

// ─ Logo mark ──────────────────────────────────────────────────────────────────

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

// ─ Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: TEAL, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{value}</p>
      <p style={{ fontSize: 13, color: "#8fabb5", margin: 0, lineHeight: 1.4 }}>{label}</p>
    </div>
  );
}

// ─ Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 14,
      padding: "20px 22px",
    }}>
      <p style={{ fontSize: 24, margin: "0 0 12px" }}>{icon}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#eaf2f3", margin: "0 0 8px", letterSpacing: "-0.01em" }}>{title}</p>
      <p style={{ fontSize: 13.5, color: "#8fabb5", lineHeight: 1.6, margin: 0 }}>{body}</p>
    </div>
  );
}

// ─ Workflow step ─────────────────────────────────────────────────────────────

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "rgba(20,184,166,0.15)", border: `1px solid rgba(20,184,166,0.3)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: TEAL }}>{n}</span>
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#eaf2f3", margin: "0 0 4px" }}>{title}</p>
        <p style={{ fontSize: 13.5, color: "#8fabb5", lineHeight: 1.6, margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

// ─ Sample finding card (demo) ─────────────────────────────────────────────────

function SampleFinding({ payer, code, amount, action, badge }: {
  payer: string; code: string; amount: string; action: string; badge: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 11, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{
        flexShrink: 0, padding: "2px 8px", borderRadius: 7,
        background: "rgba(194,85,61,0.18)", color: "#e07060",
        fontSize: 11, fontWeight: 700, fontFamily: MONO, marginTop: 2, whiteSpace: "nowrap",
      }}>
        {code}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#eaf2f3", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payer}</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: TEAL, margin: 0, flexShrink: 0, fontFamily: MONO }}>{amount}</p>
        </div>
        <p style={{ fontSize: 12, color: "#8fabb5", margin: "0 0 6px", lineHeight: 1.4 }}>{action}</p>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 6,
          background: "rgba(20,184,166,0.15)", color: TEAL,
          fontSize: 10.5, fontWeight: 600,
        }}>{badge}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", fontFamily: F }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, background: NAVY, zIndex: 50,
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/trust" style={{ fontSize: 13.5, color: "#8fabb5", textDecoration: "none", fontWeight: 500 }}>Security</a>
          <a href="/sign-in" style={{ fontSize: 13.5, color: "#eaf2f3", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
          <a
            href="/book-demo"
            style={{
              padding: "8px 16px", background: TEAL, color: "#fff",
              borderRadius: 8, fontSize: 13.5, fontWeight: 700, textDecoration: "none",
            }}
          >
            Book a demo
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px 64px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 20,
          background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)",
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: TEAL, letterSpacing: "0.04em" }}>Private beta — physician practices only</span>
        </div>

        <h1 style={{
          fontSize: 52, fontWeight: 800, color: "#eaf2f3", lineHeight: 1.1,
          letterSpacing: "-0.035em", margin: "0 0 20px",
        }}>
          Stop leaving money<br />
          <span style={{ color: TEAL }}>on the table.</span>
        </h1>

        <p style={{
          fontSize: 19, color: "#8fabb5", lineHeight: 1.65, maxWidth: "52ch",
          margin: "0 auto 40px",
        }}>
          Simera finds every denied claim, underpayment, and wrong write-off in your 835 ERA files — and generates the exact appeal that gets you paid.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <a
            href="/book-demo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              padding: "14px 28px", borderRadius: 10,
              background: TEAL, color: "#fff",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 4px 20px -4px ${TEAL}60`,
              letterSpacing: "-0.01em",
            }}
          >
            Book a demo →
          </a>
          <a
            href="/sign-in"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              padding: "14px 24px", borderRadius: 10,
              background: "rgba(255,255,255,0.07)", color: "#eaf2f3",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}
          >
            Sign in
          </a>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
          <Stat value="17.1%" label="Avg revenue leakage in primary care (MGMA)" />
          <Stat value="60s" label="Time to first finding from 835 upload" />
          <Stat value="3-tier" label="Win rate intelligence: empirical → network → industry" />
          <Stat value="0 PHI" label="Stored after processing — HIPAA-compliant architecture" />
        </div>
      </section>

      {/* Sample audit findings */}
      <section style={{ maxWidth: 860, margin: "0 auto", padding: "72px 32px 56px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, marginBottom: 10 }}>
            Sample Audit — Riverview Family Medicine
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.025em", margin: "0 0 10px" }}>
            Here&apos;s what Simera found in one month of claims
          </h2>
          <p style={{ fontSize: 15, color: "#8fabb5", maxWidth: "50ch", margin: "0 auto" }}>
            A fictional 5-provider family medicine practice. These are the numbers a real audit produces.
          </p>
        </div>

        {/* Headline numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Revenue at risk", value: "$48,621", accent: "#c2553d", bg: "rgba(194,85,61,0.10)", border: "rgba(194,85,61,0.22)" },
            { label: "Expected recovery", value: "$31,204", accent: TEAL, bg: "rgba(20,184,166,0.10)", border: "rgba(20,184,166,0.22)" },
            { label: "Denial rate", value: "12.3%", accent: "#bd852f", bg: "rgba(189,133,47,0.10)", border: "rgba(189,133,47,0.22)" },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: MONO, fontSize: 10, color: item.accent, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>{item.label}</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: item.accent, margin: 0, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Sample findings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SampleFinding payer="United Healthcare" code="CO-97" amount="$8,240" action="Resubmit 14 claims with modifier -59 · 72% network win rate" badge="🌐 Network: 72% win rate" />
          <SampleFinding payer="Aetna" code="CO-4" amount="$6,180" action="Medical necessity letters needed for 9 prior auth denials · Avg 18 days to pay" badge="✓ Your data: 68% win rate" />
          <SampleFinding payer="BlueCross" code="CO-16" amount="$4,350" action="Missing/invalid data on 11 claims — quickest wins, fastest path to cash" badge="Industry: 66% win rate" />
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p style={{ fontSize: 12.5, color: "#5c747e", margin: 0 }}>+ 14 more findings · Full audit on sign-in</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 32px" }}>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, textAlign: "center", marginBottom: 10 }}>How it works</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.025em", margin: "0 0 40px", textAlign: "center" }}>
            From 835 upload to recovery plan in under a minute
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Step n="01" title="Upload your 835 ERA file" body="Drag and drop any .835 file from your practice management system. Simera validates the EDI structure before processing so you never get garbage output." />
            <Step n="02" title="Simera analyzes every claim" body="Our AI engine reads every CLP, SVC, and CAS segment — matching denied claims to CARC codes, comparing paid amounts against contracted rates, and flagging wrong write-offs." />
            <Step n="03" title="Get ranked findings with recovery plans" body="Each finding shows exactly how much you're owed, the probability of recovery, and the specific appeal letter or action required. Sorted by dollar impact." />
            <Step n="04" title="Generate appeals, track outcomes" body="One-click AI appeal letters with the right medical necessity arguments and documentation checklist. Track submissions and log outcomes to improve your win-rate data." />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "64px 32px" }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, textAlign: "center", marginBottom: 10 }}>Capabilities</p>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.025em", margin: "0 0 36px", textAlign: "center" }}>
          Everything your billing team needs
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <FeatureCard icon="🔍" title="Denial intelligence" body="CARC/RARC code analysis with network-level win rates. Know before you appeal whether it's worth the effort." />
          <FeatureCard icon="💰" title="Underpayment detection" body="Automatically compare paid amounts against your contracted rates. Stop accepting less than you're owed." />
          <FeatureCard icon="⚡" title="AI appeal letters" body="Legally-reviewed template letters personalized to the denial reason, payer, and CPT codes — reviewed by a human before sending." />
          <FeatureCard icon="📊" title="Payer scorecards" body="Rank your payers by denial rate, average days to payment, and underpayment frequency. Know who to renegotiate with." />
          <FeatureCard icon="🌐" title="Network win rates" body="As more practices use Simera, every practice gets smarter. Aggregate denial outcomes power everyone's recovery predictions." />
          <FeatureCard icon="🛡" title="HIPAA-compliant" body="835 files processed in-memory. No PHI stored after analysis. HMAC claim tokens. BAAs with all subprocessors." />
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "rgba(20,184,166,0.07)", borderTop: "1px solid rgba(20,184,166,0.18)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "72px 32px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.025em", margin: "0 0 12px" }}>
            Ready to find your revenue?
          </h2>
          <p style={{ fontSize: 15, color: "#8fabb5", marginBottom: 32, lineHeight: 1.6 }}>
            30 minutes. Live audit on your own 835 file. See every dollar you&apos;re leaving on the table — and the exact path to get it back.
          </p>
          <a
            href="/book-demo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "15px 32px", borderRadius: 10,
              background: TEAL, color: "#fff",
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: `0 4px 24px -6px ${TEAL}80`,
              letterSpacing: "-0.01em",
            }}
          >
            Book a 30-min demo →
          </a>
          <p style={{ fontSize: 12.5, color: "#5c747e", marginTop: 16 }}>
            Already have access? <a href="/sign-in" style={{ color: TEAL, textDecoration: "none" }}>Sign in →</a>
            {" · "}
            <a href="/trust" style={{ color: TEAL, textDecoration: "none" }}>Security & Trust Center</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Logo />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { label: "Trust & Security", href: "/trust" },
              { label: "HIPAA", href: "/legal/hipaa" },
              { label: "Privacy", href: "/legal/privacy" },
              { label: "BAA", href: "/legal/baa" },
              { label: "Terms", href: "/legal/terms" },
              { label: "Sign in", href: "/sign-in" },
            ].map(({ label, href }) => (
              <a key={href} href={href} style={{ fontSize: 12.5, color: "#5c747e", textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#3a5460", margin: 0 }}>© 2026 Simera Health, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
