import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security & Trust — Simera Health",
  description:
    "How Simera Health protects your practice's patient data: HIPAA compliance, vendor BAAs, encryption, access controls, and subprocessor transparency.",
};

// ── Primitives ────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#f6f8f8",
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
  } as React.CSSProperties,

  inner: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "60px 32px 120px",
  } as React.CSSProperties,

  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#5c747e",
    fontSize: 14,
    textDecoration: "none",
    marginBottom: 48,
  } as React.CSSProperties,

  eyebrow: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#14b8a6",
    marginBottom: 10,
  } as React.CSSProperties,

  h1: {
    fontSize: 36,
    fontWeight: 800,
    color: "#0b2734",
    letterSpacing: "-0.03em",
    margin: "0 0 12px",
    lineHeight: 1.15,
  } as React.CSSProperties,

  lead: {
    fontSize: 16,
    color: "#3a5460",
    lineHeight: 1.7,
    marginBottom: 48,
    maxWidth: "62ch",
  } as React.CSSProperties,

  h2: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0b2734",
    marginTop: 56,
    marginBottom: 16,
    letterSpacing: "-0.02em",
  } as React.CSSProperties,

  p: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#3a5460",
    marginBottom: 14,
  } as React.CSSProperties,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

type BadgeStatus = "done" | "pending" | "baa";

function Badge({ status, label }: { status: BadgeStatus; label: string }) {
  const styles: Record<BadgeStatus, { bg: string; color: string }> = {
    done:    { bg: "#e4f4f1", color: "#0c8174" },
    pending: { bg: "#fef3e2", color: "#c89020" },
    baa:     { bg: "#e8f0fe", color: "#2a6f97" },
  };
  const { bg, color } = styles[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: bg, color, fontSize: 12, fontWeight: 600,
    }}>
      {status === "done"    && <CheckIcon />}
      {status === "pending" && <ClockIcon />}
      {label}
    </span>
  );
}

interface ControlCardProps {
  icon: string;
  title: string;
  items: string[];
  status?: BadgeStatus;
  statusLabel?: string;
}

function ControlCard({ icon, title, items, status, statusLabel }: ControlCardProps) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(11,39,52,0.09)",
      borderRadius: 14,
      padding: "20px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: 0 }}>{title}</p>
        </div>
        {status && statusLabel && <Badge status={status} label={statusLabel} />}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#14b8a6", marginTop: 4, flexShrink: 0 }}><CheckIcon /></span>
            <span style={{ fontSize: 14, color: "#3a5460", lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface VendorRow {
  vendor: string;
  role: string;
  dataType: string;
  baaStatus: "Signed" | "Pending" | "Required — contact us";
  link?: string;
  certifications?: string;
}

function VendorTable({ vendors }: { vendors: VendorRow[] }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid rgba(11,39,52,0.09)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr style={{ background: "#f3f6f7" }}>
            {["Vendor", "Role in Simera", "Data accessed", "BAA status", "Certifications"].map(h => (
              <th key={h} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 11, fontWeight: 700, color: "#5c747e",
                letterSpacing: "0.07em", textTransform: "uppercase",
                borderBottom: "1px solid rgba(11,39,52,0.09)",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vendors.map((v, i) => (
            <tr key={v.vendor} style={{ borderBottom: i < vendors.length - 1 ? "1px solid rgba(11,39,52,0.06)" : "none" }}>
              <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "#0b2734" }}>
                {v.link ? <a href={v.link} target="_blank" rel="noopener noreferrer" style={{ color: "#0b2734", textDecoration: "none" }}>{v.vendor} ↗</a> : v.vendor}
              </td>
              <td style={{ padding: "12px 14px", fontSize: 13, color: "#3a5460" }}>{v.role}</td>
              <td style={{ padding: "12px 14px", fontSize: 13, color: "#3a5460" }}>{v.dataType}</td>
              <td style={{ padding: "12px 14px" }}>
                <Badge
                  status={v.baaStatus === "Signed" ? "done" : v.baaStatus === "Pending" ? "pending" : "baa"}
                  label={v.baaStatus}
                />
              </td>
              <td style={{ padding: "12px 14px", fontSize: 12, color: "#8aa0a8" }}>{v.certifications ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page data ─────────────────────────────────────────────────────────────────

const VENDORS: VendorRow[] = [
  {
    vendor: "Anthropic",
    role: "AI engine — generates appeal letters, denial insights",
    dataType: "De-identified claim descriptions (no patient name/DOB)",
    baaStatus: "Pending",
    link: "https://www.anthropic.com",
    certifications: "SOC 2 Type II",
  },
  {
    vendor: "Amazon Web Services",
    role: "Cloud infrastructure, ECS compute, ECR, S3",
    dataType: "Ephemeral: 835 files during processing only",
    baaStatus: "Signed",
    link: "https://aws.amazon.com",
    certifications: "HIPAA, SOC 2, ISO 27001",
  },
  {
    vendor: "Supabase",
    role: "Database — claim ledger, audit history, user settings",
    dataType: "De-identified claim tokens (HMAC), audit results",
    baaStatus: "Pending",
    link: "https://supabase.com",
    certifications: "SOC 2 Type II",
  },
  {
    vendor: "Vercel",
    role: "Frontend hosting",
    dataType: "No PHI — static assets and API calls only",
    baaStatus: "Pending",
    link: "https://vercel.com",
    certifications: "SOC 2 Type II",
  },
  {
    vendor: "Clerk",
    role: "Authentication — user identity, session management",
    dataType: "Email, name, clerk user ID (no PHI)",
    baaStatus: "Pending",
    link: "https://clerk.com",
    certifications: "SOC 2 Type II",
  },
  {
    vendor: "Stripe",
    role: "Payment processing — subscription billing",
    dataType: "Payment card data only (no PHI ever)",
    baaStatus: "Required — contact us",
    link: "https://stripe.com",
    certifications: "PCI DSS Level 1, SOC 2",
  },
];

const SECURITY_CONTROLS: ControlCardProps[] = [
  {
    icon: "🔒",
    title: "Encryption",
    status: "done",
    statusLabel: "In production",
    items: [
      "TLS 1.3 in transit for all API and web traffic",
      "AES-256 encryption at rest for all database records",
      "Portal credentials encrypted with Fernet before storage — never plaintext",
      "Clerk JWT tokens signed with RS256; verified on every API request",
    ],
  },
  {
    icon: "🏥",
    title: "PHI Handling",
    status: "done",
    statusLabel: "In production",
    items: [
      "835 files processed entirely in-memory — never written to container filesystem",
      "PHI scrubbed from application logs with [redacted] pattern",
      "Claim identifiers stored as HMAC-SHA256 tokens; original values never persisted",
      "S3 upload bucket is private with server-side encryption; objects deleted after processing",
      "SUPABASE_SERVICE_KEY is server-only — never exposed to browser clients",
    ],
  },
  {
    icon: "👤",
    title: "Access Controls",
    status: "done",
    statusLabel: "In production",
    items: [
      "Clerk-issued JWTs required for all authenticated routes",
      "Row Level Security (RLS) enforced at the database level — users can only read their own data",
      "Supabase service-role key restricted to server-side functions only",
      "HMAC claim tokens are scoped per practice — cross-practice claim identification is cryptographically impossible",
    ],
  },
  {
    icon: "⏱",
    title: "Session Security",
    status: "done",
    statusLabel: "In production",
    items: [
      "30-minute idle timeout with automatic session lock",
      "Session lock shows blur overlay over PHI-adjacent content",
      "Manual session re-authentication required after timeout",
    ],
  },
  {
    icon: "📋",
    title: "Audit Logging",
    status: "done",
    statusLabel: "In production",
    items: [
      "All API requests include clerk_user_id and request timestamps",
      "Audit job lifecycle (created → queued → complete/error) fully logged",
      "Appeal letter generation events logged for compliance review",
    ],
  },
  {
    icon: "🛡",
    title: "Compliance Program",
    status: "pending",
    statusLabel: "In progress",
    items: [
      "HIPAA Business Associate Agreements (BAAs) required from all subprocessors before PHI enters system",
      "SOC 2 Type II audit scheduled — Q4 2026",
      "HIPAA Security Rule (45 CFR Part 164) technical safeguards implemented",
      "Workforce training and incident response plan in development",
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrustPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>
        <a href="/" style={S.backLink}>← Back to Simera</a>

        {/* Hero */}
        <p style={S.eyebrow}>Security &amp; Trust Center</p>
        <h1 style={S.h1}>Your patients&apos; data is treated like it&apos;s our own</h1>
        <p style={S.lead}>
          Simera handles Protected Health Information (PHI) on behalf of physician practices as a HIPAA Business Associate.
          This page explains exactly how we protect that data, which vendors touch it, and what controls are in place.
        </p>

        {/* Status banner */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          background: "#fff", border: "1px solid rgba(11,39,52,0.10)",
          borderRadius: 14, padding: "18px 22px", marginBottom: 16,
        }}>
          <div style={{ color: "#14b8a6", flexShrink: 0, marginTop: 2 }}><ShieldIcon /></div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0b2734", margin: "0 0 4px" }}>
              Active policy: no real PHI until all BAAs are signed
            </p>
            <p style={{ fontSize: 14, color: "#5c747e", lineHeight: 1.6, margin: 0 }}>
              We do not permit any real patient data to enter the Simera system until Business Associate Agreements are fully executed with Simera Health and all subprocessors listed below. During the current phase, Simera operates exclusively on synthetic/demo data.
            </p>
          </div>
        </div>

        {/* BAA request CTA */}
        <div style={{
          background: "#0b2734",
          borderRadius: 14, padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, flexWrap: "wrap" as const,
          marginBottom: 8,
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#eaf2f3", margin: "0 0 4px" }}>
              Ready to use Simera with real practice data?
            </p>
            <p style={{ fontSize: 14, color: "#8fabb5", margin: 0 }}>
              Contact us to initiate the BAA process — we&apos;ll walk through each subprocessor agreement.
            </p>
          </div>
          <a
            href="mailto:security@simerahealth.org?subject=BAA Request — Simera Health"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 9,
              background: "#14b8a6", color: "#fff",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
              flexShrink: 0, letterSpacing: "-0.01em",
              whiteSpace: "nowrap" as const,
            }}
          >
            Request BAA →
          </a>
        </div>

        {/* Security controls grid */}
        <h2 style={S.h2}>Security Controls</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 14 }}>
          {SECURITY_CONTROLS.map(c => (
            <ControlCard key={c.title} {...c} />
          ))}
        </div>

        {/* Subprocessors */}
        <h2 style={S.h2}>Subprocessors &amp; Vendor BAA Status</h2>
        <p style={S.p}>
          These are all the vendors that could potentially come into contact with PHI when Simera processes your 835 ERA files. We are actively pursuing BAAs with each vendor. No real patient data is permitted in the system until all agreements are complete.
        </p>
        <VendorTable vendors={VENDORS} />
        <p style={{ fontSize: 13, color: "#8aa0a8", marginTop: 10, marginBottom: 0 }}>
          * "Pending" means BAA negotiation is in progress. "Signed" means agreement is fully executed.
        </p>

        {/* Data flow */}
        <h2 style={S.h2}>What happens to your 835 file</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { step: "01", title: "Upload", body: "Your 835 file is uploaded directly to a private S3 bucket with server-side AES-256 encryption. The presigned URL expires in 15 minutes." },
            { step: "02", title: "Parse", body: "The ECS API container reads the file from S3 into memory. The raw file is never written to disk inside the container. PHI is parsed and immediately tokenized." },
            { step: "03", title: "Analyze", body: "Claim tokens (HMAC-SHA256), de-identified CPT/CARC codes, and amounts are analyzed by the leakage detection engine. No patient identifiers are passed to the AI." },
            { step: "04", title: "Store", body: "Audit results (de-identified findings, recovery amounts, denial codes) are stored in the Supabase database under your clerk_user_id. Raw PHI is never persisted." },
            { step: "05", title: "Delete", body: "The S3 object is deleted after successful processing. If processing fails, the object is deleted after 24 hours via a lifecycle rule." },
          ].map(({ step, title, body }) => (
            <div key={step} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              background: "#fff", borderRadius: 12, padding: "16px 18px",
              border: "1px solid rgba(11,39,52,0.09)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: "#0b2734",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: "#14b8a6" }}>{step}</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", margin: "0 0 4px" }}>{title}</p>
                <p style={{ fontSize: 14, color: "#5c747e", lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <h2 style={S.h2}>Contact Security</h2>
        <p style={S.p}>
          For security questions, vulnerability disclosures, BAA requests, or incident reports, contact us at{" "}
          <a href="mailto:security@simerahealth.org" style={{ color: "#14b8a6" }}>security@simerahealth.org</a>.
          We respond to all security inquiries within 24 hours.
        </p>
        <p style={{ ...S.p, fontSize: 13, color: "#8aa0a8" }}>
          Last reviewed: June 11, 2026
        </p>

        {/* Demo CTA */}
        <div style={{
          marginTop: 56,
          background: "#0b2734",
          borderRadius: 16,
          padding: "32px 28px",
          textAlign: "center",
        }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 12 }}>
            Ready to see it in action?
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#eaf2f3", letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            30 minutes. Zero PHI required.
          </h3>
          <p style={{ fontSize: 14, color: "#8fabb5", marginBottom: 24, lineHeight: 1.6 }}>
            Live audit walkthrough using synthetic data. See exactly what Simera finds in a real 835 file and how the appeal workflow operates.
          </p>
          <a
            href="/book-demo"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 9,
              background: "#14b8a6", color: "#fff",
              fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}
          >
            Book a demo →
          </a>
        </div>
      </div>
    </div>
  );
}
