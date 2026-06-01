export const metadata = { title: "Terms of Service — Simera Health" };

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

export default function TermsPage() {
  return (
    <article>
      <H1>Terms of Service</H1>
      <p style={{ fontSize: 13, color: "#8aa0a8", marginBottom: 48, fontFamily: "'IBM Plex Mono', monospace" }}>
        Last updated: June 1, 2026 · Effective: June 1, 2026
      </p>

      <P>
        These Terms of Service ("Terms") govern your access to and use of Simera Health, Inc. ("Simera," "we," "our," or "us") products and services, including the Simera web application at app.simerahealth.org (the "Service"). By creating an account or using the Service, you agree to these Terms.
      </P>

      <H2>1. Description of Service</H2>
      <P>
        Simera provides AI-assisted revenue cycle analysis tools for independent physician practices and medical billing companies. The Service analyzes 835 Electronic Remittance Advice (ERA) files to identify revenue leakage, denial patterns, and recovery opportunities.
      </P>
      <P>
        <strong>The Service is a financial and administrative analytics tool only.</strong> Simera does not provide medical advice, legal advice, coding determinations, or compliance opinions. All outputs are informational and should be reviewed and verified by qualified billing staff, certified professional coders (CPCs), or healthcare attorneys before action is taken.
      </P>

      <H2>2. Eligibility</H2>
      <P>
        You must be at least 18 years old and authorized to enter into contracts on behalf of your practice or organization. By using the Service, you represent that you have the authority to bind your organization to these Terms.
      </P>

      <H2>3. Account Registration</H2>
      <P>
        You are responsible for maintaining the security of your account credentials. You must notify us immediately at security@simera.health if you suspect unauthorized access. You are responsible for all activity that occurs under your account.
      </P>

      <H2>4. Permitted Use</H2>
      <P>You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</P>
      <UL>
        <LI>Upload data you do not have legal authority to process</LI>
        <LI>Attempt to reverse-engineer, copy, or create derivative works of the Service</LI>
        <LI>Use the Service to transmit malware, spam, or unauthorized automated requests</LI>
        <LI>Share your account credentials with third parties</LI>
        <LI>Use the Service in any way that violates applicable law, including HIPAA</LI>
      </UL>

      <H2>5. Data and HIPAA</H2>
      <P>
        835 ERA files may contain Protected Health Information (PHI) as defined under HIPAA. Before uploading files containing PHI, you must execute a Business Associate Agreement (BAA) with Simera. Contact us at compliance@simera.health to request a BAA.
      </P>
      <P>
        <strong>Do not upload PHI without a signed BAA in place.</strong> If you upload files containing PHI without a signed BAA, you are solely responsible for any resulting HIPAA violations.
      </P>
      <P>
        We process your data in accordance with our Privacy Policy and, where applicable, the BAA.
      </P>

      <H2>6. AI-Generated Content</H2>
      <P>
        The Service uses artificial intelligence to analyze your data and generate recommendations. AI-generated outputs may contain errors, omissions, or inaccuracies. You acknowledge that:
      </P>
      <UL>
        <LI>All AI outputs are informational only and do not constitute professional billing, coding, legal, or clinical advice</LI>
        <LI>You are solely responsible for verifying AI-generated figures and recommendations before acting on them</LI>
        <LI>Simera is not liable for financial losses arising from reliance on AI-generated content without independent verification</LI>
      </UL>

      <H2>7. Subscription and Payment</H2>
      <P>
        Subscription fees are billed monthly or annually as selected at signup. All fees are non-refundable except as required by law or as explicitly stated in your subscription agreement. We reserve the right to modify pricing with 30 days' notice.
      </P>

      <H2>8. Intellectual Property</H2>
      <P>
        Simera retains all rights to the Service, including all software, algorithms, and AI models. You retain ownership of your uploaded data. By uploading data, you grant Simera a limited license to process that data solely to provide the Service.
      </P>
      <P>
        We may use aggregated, de-identified data to improve our models and benchmarks. We will never sell your identifiable data to third parties.
      </P>

      <H2>9. Limitation of Liability</H2>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIMERA'S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICE SHALL NOT EXCEED THE FEES YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM. SIMERA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
      </P>

      <H2>10. Disclaimer of Warranties</H2>
      <P>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. SIMERA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI-GENERATED OUTPUTS WILL BE ACCURATE OR COMPLETE.
      </P>

      <H2>11. Termination</H2>
      <P>
        Either party may terminate the Service subscription with 30 days' written notice. We may suspend or terminate your access immediately for material breach of these Terms, including unauthorized use of PHI. Upon termination, we will provide you a reasonable opportunity to export your data.
      </P>

      <H2>12. Governing Law</H2>
      <P>
        These Terms are governed by the laws of the State of Delaware, without regard to conflict-of-law provisions. Any disputes shall be resolved by binding arbitration in accordance with AAA Commercial Arbitration Rules.
      </P>

      <H2>13. Changes to Terms</H2>
      <P>
        We may update these Terms from time to time. We will notify you of material changes via email or in-app notice at least 14 days before they take effect. Continued use of the Service after changes constitutes acceptance.
      </P>

      <H2>14. Contact</H2>
      <P>
        Simera Health, Inc.<br />
        legal@simera.health<br />
        compliance@simera.health (HIPAA matters)
      </P>
    </article>
  );
}
