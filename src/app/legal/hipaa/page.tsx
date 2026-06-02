export const metadata = { title: "HIPAA Notice of Privacy Practices — Simera Health" };

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

export default function HipaaPage() {
  return (
    <article>
      <H1>HIPAA Notice of Privacy Practices</H1>
      <p style={{ fontSize: 13, color: "#8aa0a8", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
        Effective: June 1, 2026
      </p>
      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "14px 18px", marginBottom: 40, fontSize: 14, color: "#856404", lineHeight: 1.6 }}>
        <strong>THIS NOTICE DESCRIBES HOW HEALTH INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</strong>
      </div>

      <H2>Who We Are</H2>
      <P>
        Simera Health, Inc. ("Simera") operates as a Business Associate under the Health Insurance Portability and Accountability Act of 1996 (HIPAA) and its implementing regulations. We provide revenue cycle intelligence services to covered healthcare entities ("Covered Entities"). We receive, process, and store Protected Health Information (PHI) on behalf of those Covered Entities under a signed Business Associate Agreement (BAA).
      </P>
      <P>
        This Notice applies to PHI that Simera receives, creates, or maintains in the course of providing services to Covered Entities. It does not replace the Notice of Privacy Practices provided by your healthcare provider.
      </P>

      <H2>What Is Protected Health Information (PHI)?</H2>
      <P>
        PHI is individually identifiable health information transmitted or maintained in any form or medium. In the context of Simera's services, PHI typically appears in 835 Electronic Remittance Advice (ERA) files uploaded by Covered Entities and may include patient names, claim identifiers, diagnosis codes, service dates, and payment information.
      </P>

      <H2>How We Use and Disclose PHI</H2>
      <P>As a Business Associate, Simera may use and disclose PHI only as permitted by our BAA and applicable law:</P>
      <UL>
        <LI><strong>To provide services:</strong> We process PHI to generate revenue cycle analysis, denial pattern reports, and financial intelligence on behalf of your Covered Entity.</LI>
        <LI><strong>For operations:</strong> We may use PHI to monitor the quality of our services, train staff (using de-identified data only), and ensure the integrity of our systems.</LI>
        <LI><strong>As required by law:</strong> We may disclose PHI when required by law, including to respond to lawful government requests, court orders, or legal proceedings.</LI>
        <LI><strong>To prevent harm:</strong> We may disclose PHI to prevent or lessen a serious and imminent threat to the health or safety of a person or the public.</LI>
        <LI><strong>To subcontractors:</strong> We may share PHI with our subcontractors (e.g., cloud infrastructure providers) who agree to the same restrictions through executed sub-BAAs.</LI>
      </UL>
      <P>
        We will not use or disclose PHI for marketing purposes, sell PHI, or use PHI in any manner that is not permitted by our BAA or required by law.
      </P>

      <H2>Subcontractors and Sub-BAAs</H2>
      <P>Simera uses the following subcontractors that may access PHI, each under a signed sub-BAA or equivalent data processing agreement:</P>
      <UL>
        <LI><strong>Amazon Web Services (AWS)</strong> — cloud infrastructure, encrypted storage (us-east-1)</LI>
        <LI><strong>Anthropic</strong> — AI analysis engine (PHI processed under BAA)</LI>
        <LI><strong>Supabase</strong> — database (hosted on AWS infrastructure)</LI>
      </UL>

      <H2>Safeguards</H2>
      <P>Simera implements the following administrative, physical, and technical safeguards for PHI:</P>
      <UL>
        <LI>Encryption in transit (TLS 1.2+) and at rest (AES-256)</LI>
        <LI>Access controls: role-based access, least privilege, multi-factor authentication</LI>
        <LI>Audit logging: all PHI access events are logged and retained for 6 years</LI>
        <LI>Workforce training: all personnel with PHI access complete annual HIPAA training</LI>
        <LI>Incident response: written breach notification procedures per 45 CFR § 164.410</LI>
        <LI>Data minimization: PHI is processed only as necessary to fulfill service obligations</LI>
      </UL>

      <H2>Breach Notification</H2>
      <P>
        In the event of a breach of unsecured PHI, Simera will notify the affected Covered Entity without unreasonable delay and no later than 60 calendar days following discovery of the breach, in accordance with 45 CFR § 164.410. The notification will include the information required by HIPAA.
      </P>

      <H2>Data Retention and Destruction</H2>
      <P>
        PHI is retained for the duration of the BAA and for any period required by applicable law or regulation. Upon termination of the BAA, Simera will return or destroy all PHI in its possession, unless retention is required by law, in which case we will continue to protect the PHI and limit further use.
      </P>

      <H2>Individual Rights</H2>
      <P>
        Because Simera acts as a Business Associate (not a Covered Entity), individuals must exercise their HIPAA rights (access, amendment, accounting of disclosures, restriction, etc.) directly with their healthcare provider or the Covered Entity that holds their records. Simera will support Covered Entities in fulfilling these obligations as required by our BAA.
      </P>

      <H2>Changes to This Notice</H2>
      <P>
        Simera reserves the right to change this Notice at any time. Changes will be posted on our website with an updated effective date. Material changes will be communicated to Covered Entities directly.
      </P>

      <H2>Contact Us</H2>
      <P>
        For questions about this Notice or our HIPAA compliance practices, contact our Privacy Officer:
      </P>
      <P>
        <strong>Simera Health, Inc.</strong><br />
        Privacy Officer<br />
        <a href="mailto:compliance@simera.health" style={{ color: "#14b8a6" }}>compliance@simera.health</a>
      </P>
    </article>
  );
}
