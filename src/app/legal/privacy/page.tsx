export const metadata = { title: "Privacy Policy — Simera Health" };

const H1 = ({ children }: { children: React.ReactNode }) => (
  <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0b2734", letterSpacing: "-0.03em", marginBottom: 8 }}>{children}</h1>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b2734", marginTop: 40, marginBottom: 12 }}>{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 15, lineHeight: 1.7, color: "#3a5460", marginBottom: 14 }}>{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul style={{ paddingLeft: 20, marginBottom: 14 }}>{children}</ul>
);
const LI = ({ children }: { children: React.ReactNode }) => (
  <li style={{ fontSize: 15, lineHeight: 1.7, color: "#3a5460", marginBottom: 6 }}>{children}</li>
);

export default function PrivacyPage() {
  return (
    <article>
      <H1>Privacy Policy</H1>
      <p style={{ fontSize: 13, color: "#8aa0a8", marginBottom: 48, fontFamily: "'IBM Plex Mono', monospace" }}>
        Last updated: June 1, 2026 · Effective: June 1, 2026
      </p>

      <P>
        Simera Health, Inc. ("Simera," "we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our Service. This policy applies to all users of the Simera web application.
      </P>
      <P>
        If your use of the Service involves Protected Health Information (PHI), that data is governed by our HIPAA Business Associate Agreement (BAA), which takes precedence over this Privacy Policy for PHI.
      </P>

      <H2>1. Information We Collect</H2>
      <P><strong>Account information:</strong> Name, email address, organization name, and authentication credentials (managed by Clerk).</P>
      <P><strong>Uploaded data:</strong> 835 ERA files and other billing data you upload to the Service. This data may contain PHI. We process this data solely to provide the Service.</P>
      <P><strong>Usage data:</strong> Pages visited, features used, queries submitted to the AI assistant, timestamps, and error logs. This is used to improve the Service.</P>
      <P><strong>Technical data:</strong> IP address, browser type, device type, and operating system. Collected automatically when you access the Service.</P>

      <H2>2. How We Use Your Information</H2>
      <UL>
        <LI>To provide, operate, and improve the Service</LI>
        <LI>To analyze your 835 data and generate revenue cycle insights</LI>
        <LI>To respond to your support requests</LI>
        <LI>To send transactional emails (audit complete, deadline reminders)</LI>
        <LI>To detect and prevent fraud, abuse, and security incidents</LI>
        <LI>To comply with legal obligations</LI>
        <LI>To generate aggregated, de-identified benchmarks (never linked to you)</LI>
      </UL>
      <P>We do not sell your personal information or PHI to third parties. We do not use your PHI to train AI models without explicit consent.</P>

      <H2>3. How We Share Your Information</H2>
      <P><strong>Service providers:</strong> We share data with vendors who help us operate the Service, all under data processing agreements:</P>
      <UL>
        <LI>Amazon Web Services (AWS) — infrastructure, storage, logging</LI>
        <LI>Anthropic — AI analysis (under BAA for PHI)</LI>
        <LI>Supabase — database</LI>
        <LI>Vercel — frontend hosting</LI>
        <LI>Clerk — authentication</LI>
      </UL>
      <P><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the rights and safety of Simera and its users.</P>
      <P><strong>Business transfers:</strong> In the event of a merger or acquisition, your data may be transferred to the successor entity under the same privacy protections.</P>

      <H2>4. HIPAA and Protected Health Information</H2>
      <P>
        Simera is designed for use with 835 ERA files that may contain PHI. When you execute a BAA with us, we become your Business Associate under HIPAA and are obligated to:
      </P>
      <UL>
        <LI>Use PHI only as permitted by the BAA and HIPAA</LI>
        <LI>Implement appropriate administrative, physical, and technical safeguards</LI>
        <LI>Report breaches of unsecured PHI within 60 days of discovery</LI>
        <LI>Return or destroy PHI upon termination of the BAA</LI>
      </UL>
      <P>Contact compliance@simera.health to execute a BAA before uploading PHI.</P>

      <H2>5. Data Security</H2>
      <P>We implement industry-standard security measures including:</P>
      <UL>
        <LI>Encryption in transit (TLS 1.2+) and at rest (AES-256 via AWS KMS)</LI>
        <LI>Access controls and authentication (Clerk with MFA support)</LI>
        <LI>Network isolation (private VPC subnets, no public API IPs)</LI>
        <LI>Audit logging of all data access events (CloudTrail + CloudWatch)</LI>
        <LI>Regular security reviews and dependency scanning</LI>
      </UL>
      <P>No system is perfectly secure. If you believe your account has been compromised, contact security@simera.health immediately.</P>

      <H2>6. Data Retention</H2>
      <P>
        We retain your account data for as long as your account is active. Uploaded 835 files and audit results are retained for 7 years to meet HIPAA minimum retention requirements, unless you request deletion sooner.
      </P>
      <P>
        Upon account termination, you may request export of your data within 30 days. After 30 days post-termination, data is deleted from active systems and purged from backups within 90 days, except where retention is required by law.
      </P>

      <H2>7. Your Rights</H2>
      <P>Depending on your jurisdiction, you may have the right to:</P>
      <UL>
        <LI>Access the personal information we hold about you</LI>
        <LI>Correct inaccurate personal information</LI>
        <LI>Request deletion of your personal information</LI>
        <LI>Export your data in a portable format</LI>
        <LI>Opt out of non-essential communications</LI>
      </UL>
      <P>To exercise these rights, contact privacy@simera.health. We will respond within 30 days.</P>

      <H2>8. Cookies and Tracking</H2>
      <P>
        We use essential cookies for authentication and session management (provided by Clerk). We do not use third-party advertising cookies or behavioral tracking cookies. We may use analytics to understand aggregate usage patterns.
      </P>

      <H2>9. Children's Privacy</H2>
      <P>
        The Service is not directed to individuals under 18. We do not knowingly collect information from minors. If we become aware that a minor has provided us information, we will delete it promptly.
      </P>

      <H2>10. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notice at least 14 days before they take effect. The "Last updated" date at the top of this page reflects the most recent revision.
      </P>

      <H2>11. Contact Us</H2>
      <P>
        Simera Health, Inc.<br />
        Privacy inquiries: privacy@simera.health<br />
        Security incidents: security@simera.health<br />
        HIPAA/compliance: compliance@simera.health
      </P>
    </article>
  );
}
