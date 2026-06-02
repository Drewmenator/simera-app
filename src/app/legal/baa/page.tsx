export const metadata = { title: "Business Associate Agreement — Simera Health" };

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

export default function BaaPage() {
  return (
    <article>
      <H1>Business Associate Agreement</H1>
      <p style={{ fontSize: 13, color: "#8aa0a8", marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace" }}>
        Template version 1.0 · Effective upon execution
      </p>

      <div style={{ background: "#e6f4f1", border: "1px solid #14b8a6", borderRadius: 8, padding: "16px 20px", marginBottom: 40 }}>
        <p style={{ margin: 0, fontSize: 14, color: "#0b2734", lineHeight: 1.6 }}>
          <strong>To execute a BAA with Simera Health:</strong> Email{" "}
          <a href="mailto:compliance@simera.health?subject=BAA%20Execution%20Request" style={{ color: "#14b8a6" }}>
            compliance@simera.health
          </a>{" "}
          with your organization name, primary contact, and NPI or Tax ID. We will send a countersigned copy within 2 business days.
        </p>
      </div>

      <P>
        This Business Associate Agreement ("BAA") is entered into between Simera Health, Inc., a Delaware corporation ("Business Associate"), and the healthcare entity executing this agreement ("Covered Entity"), and is incorporated into the Simera Health Terms of Service.
      </P>

      <H2>1. Definitions</H2>
      <P>
        Capitalized terms used in this BAA and not otherwise defined herein shall have the meanings set forth in the HIPAA Rules (45 CFR Parts 160 and 164). Key terms include:
      </P>
      <UL>
        <LI><strong>Business Associate:</strong> Simera Health, Inc.</LI>
        <LI><strong>Covered Entity:</strong> The healthcare provider or health plan executing this BAA.</LI>
        <LI><strong>PHI:</strong> Protected Health Information as defined at 45 CFR § 160.103.</LI>
        <LI><strong>HIPAA Rules:</strong> The HIPAA Privacy Rule, Security Rule, Breach Notification Rule, and Enforcement Rule.</LI>
        <LI><strong>Services:</strong> Revenue cycle analysis, denial management, and financial intelligence services provided by Simera.</LI>
      </UL>

      <H2>2. Obligations of Business Associate</H2>
      <P>Business Associate agrees to:</P>
      <UL>
        <LI>Not use or disclose PHI other than as permitted by this BAA or required by law.</LI>
        <LI>Implement appropriate administrative, physical, and technical safeguards to protect PHI (45 CFR § 164.308, 164.310, 164.312).</LI>
        <LI>Report any use or disclosure of PHI not provided for by this BAA, including breaches of unsecured PHI, to Covered Entity without unreasonable delay and no later than 60 days after discovery.</LI>
        <LI>Ensure any subcontractors that create, receive, maintain, or transmit PHI on behalf of Business Associate agree to the same restrictions through a written sub-BAA.</LI>
        <LI>Make its internal practices, books, and records relating to the use and disclosure of PHI available to the Secretary of HHS for purposes of determining compliance.</LI>
        <LI>Return or destroy all PHI upon termination of this BAA, retaining no copies, unless retention is required by law.</LI>
        <LI>Support Covered Entity in fulfilling individuals' rights under 45 CFR § 164.524 (access), § 164.526 (amendment), and § 164.528 (accounting of disclosures).</LI>
      </UL>

      <H2>3. Permitted Uses and Disclosures</H2>
      <P>Business Associate may use or disclose PHI only to:</P>
      <UL>
        <LI>Perform the Services on behalf of Covered Entity.</LI>
        <LI>Provide data aggregation services relating to the healthcare operations of Covered Entity.</LI>
        <LI>Use PHI for the proper management and administration of Business Associate, provided disclosures are required by law or Business Associate obtains reasonable assurances of confidentiality.</LI>
        <LI>De-identify PHI in accordance with 45 CFR § 164.514(b) and use de-identified data for product improvement and benchmarking.</LI>
      </UL>

      <H2>4. Obligations of Covered Entity</H2>
      <P>Covered Entity agrees to:</P>
      <UL>
        <LI>Provide Business Associate only with the minimum necessary PHI to perform the Services.</LI>
        <LI>Notify Business Associate of any restrictions on the use or disclosure of PHI that Covered Entity has agreed to with individuals.</LI>
        <LI>Not request Business Associate to use or disclose PHI in a manner that would violate the HIPAA Rules.</LI>
        <LI>Obtain all necessary authorizations and consents from patients as required by applicable law prior to sharing PHI with Business Associate.</LI>
      </UL>

      <H2>5. Term and Termination</H2>
      <P>
        This BAA is effective upon execution and remains in effect for as long as Business Associate retains PHI or performs Services under the applicable service agreement. Either party may terminate this BAA if the other party materially breaches a provision, provided the non-breaching party gives 30 days written notice and the breach is not cured within that period.
      </P>
      <P>
        Upon termination, Business Associate will return or destroy all PHI. If return or destruction is not feasible, Business Associate will extend protections of this BAA to the PHI and limit further use.
      </P>

      <H2>6. Miscellaneous</H2>
      <UL>
        <LI><strong>Amendment:</strong> This BAA may be amended only by written agreement signed by both parties. The parties agree to amend this BAA as necessary to comply with changes in the HIPAA Rules.</LI>
        <LI><strong>No Third-Party Beneficiaries:</strong> Nothing in this BAA shall confer any rights or remedies upon any person other than the parties.</LI>
        <LI><strong>Governing Law:</strong> This BAA is governed by the laws of the State of Delaware.</LI>
        <LI><strong>Entire Agreement:</strong> This BAA, together with the Simera Terms of Service, constitutes the entire agreement between the parties regarding the subject matter hereof.</LI>
        <LI><strong>Survival:</strong> Sections 2, 3, 5, and 6 survive termination of this BAA.</LI>
      </UL>

      <H2>7. Execution</H2>
      <P>
        To execute this BAA, email{" "}
        <a href="mailto:compliance@simera.health?subject=BAA%20Execution%20Request" style={{ color: "#14b8a6" }}>
          compliance@simera.health
        </a>{" "}
        with your organization name, primary contact name and title, and your NPI or Tax ID. We will prepare a countersigned copy and return it within 2 business days. Electronic signatures are accepted pursuant to the Electronic Signatures in Global and National Commerce Act (E-SIGN).
      </P>

      <div style={{ marginTop: 48, padding: "20px 24px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fafafa" }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#0b2734" }}>Simera Health, Inc.</p>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#5c747e" }}>Business Associate</p>
        <p style={{ margin: 0, fontSize: 13, color: "#5c747e" }}>
          <a href="mailto:compliance@simera.health" style={{ color: "#14b8a6" }}>compliance@simera.health</a>
        </p>
      </div>
    </article>
  );
}
