/**
 * Evidence Engine — maps every CARC denial code to:
 *   • The required evidence package for an appeal
 *   • The core legal/contractual argument
 *   • Payer response deadline guidance
 *   • Whether the denial is actually recoverable
 *
 * Each denial type is unique. This is the ruleset that drives the
 * Denial Work Queue's "Build Appeal Package" step.
 */

export interface EvidenceItem {
  id: string;
  label: string;
  description: string;
  required: boolean; // false = strongly recommended but optional
}

export interface AppealStrategy {
  carcCode: string;
  carcDescription: string;
  category: string;
  recoverable: boolean; // false = do NOT appeal (waste of time)
  appealDeadlineDays: number; // days from date of remittance to file
  winRateLabel: string; // "High (75%+)" | "Moderate (40–60%)" | "Low (<30%)"
  coreArgument: string; // the single most important thing to say in the letter
  evidence: EvidenceItem[];
  avoidanceNote: string; // how to prevent this denial in future
  urgencyNote?: string; // shown as a warning if present
}

const EVIDENCE_ENGINE: Record<string, AppealStrategy> = {
  // ─── CODING & DOCUMENTATION ────────────────────────────────────────────────
  "97": {
    carcCode: "97",
    carcDescription: "Payment adjusted because the benefit for this service is included in the payment/allowance for another service.",
    category: "Coding Errors",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (50%+)",
    coreArgument: "The services were medically distinct, performed in separate operative fields or at separate encounters. Modifier 59/XU applies. Attach documentation showing clinical distinctiveness.",
    evidence: [
      { id: "op_notes", label: "Operative / procedure notes", description: "Detailed notes showing each service was distinct and separately identifiable.", required: true },
      { id: "modifier_justification", label: "Modifier 59 / X{ESPU} justification memo", description: "One-page explanation of why the modifier applies — different session, different site, or different injury.", required: true },
      { id: "ncci_review", label: "NCCI edit review", description: "Print the relevant NCCI edit pair from the CMS website showing the edit is not absolute.", required: true },
      { id: "encounter_note", label: "Encounter / progress note", description: "Signed physician note for the date of service.", required: false },
    ],
    avoidanceNote: "Run all claims through an NCCI scrubber before submission. Flag any CPT pair that triggers an edit and pre-attach modifier justification.",
  },

  "4": {
    carcCode: "4",
    carcDescription: "The service is inconsistent with the modifier used.",
    category: "Coding Errors",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (60%+)",
    coreArgument: "The modifier used accurately reflects the clinical scenario. The service documentation supports the modifier as billed. Attach clinical notes confirming the distinct reason for the modifier.",
    evidence: [
      { id: "encounter_note", label: "Detailed encounter note", description: "Must clearly show the clinical basis for the modifier (e.g., separate encounter, bilateral, staged procedure).", required: true },
      { id: "modifier_policy", label: "Payer modifier policy excerpt", description: "Print the payer's own modifier policy from their provider manual to show compliance.", required: true },
      { id: "corrected_claim", label: "Corrected claim (if modifier was wrong)", description: "If the modifier was genuinely incorrect, submit a corrected claim instead of an appeal.", required: false },
    ],
    avoidanceNote: "Audit modifier usage in your EHR templates quarterly. High-volume modifier errors indicate a documentation workflow gap, not just a billing error.",
  },

  "11": {
    carcCode: "11",
    carcDescription: "The diagnosis is inconsistent with the procedure.",
    category: "Coding Errors",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (65%+)",
    coreArgument: "The diagnosis code accurately reflects the patient's condition and directly supports the medical necessity of the procedure billed. The ICD-10→CPT linkage is clinically appropriate.",
    evidence: [
      { id: "encounter_note", label: "Encounter note with ICD-10 linkage", description: "Note must explicitly document how the diagnosis necessitates the procedure.", required: true },
      { id: "corrected_claim", label: "Corrected claim with corrected dx", description: "If the diagnosis code was wrong, submit corrected claim immediately.", required: false },
      { id: "icd_reference", label: "ICD-10 coding reference", description: "Cite the relevant ICD-10 coding guideline supporting the code chosen.", required: false },
    ],
    avoidanceNote: "Use ICD-10 code-to-procedure linkage validation at charge entry. Most EHRs have this built in — ensure it is enabled.",
  },

  "16": {
    carcCode: "16",
    carcDescription: "Claim/service lacks information or has submission/billing errors.",
    category: "Missing Information",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (75%+)",
    coreArgument: "All required information is now provided. The claim was complete and accurate at time of original submission. Please reprocess with the attached corrected documentation.",
    evidence: [
      { id: "eob_review", label: "EOB / remittance with specific field noted", description: "Identify exactly which field the payer says is missing — then provide it.", required: true },
      { id: "original_submission", label: "Proof of original submission", description: "Clearinghouse acceptance report showing the claim was submitted with all required fields.", required: true },
      { id: "corrected_info", label: "The missing information", description: "Whatever the payer said was lacking — NPI, taxonomy code, date of birth, subscriber ID, etc.", required: true },
    ],
    avoidanceNote: "CO-16 is almost always a front-end scrubbing failure. Your clearinghouse should catch missing required fields before submission.",
  },

  // ─── ELIGIBILITY & COVERAGE ────────────────────────────────────────────────
  "27": {
    carcCode: "27",
    carcDescription: "Expenses incurred after coverage terminated.",
    category: "Eligibility / Coverage",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (70%+)",
    coreArgument: "The patient had active coverage on the date of service. Attached is real-time eligibility verification conducted on [date of service] showing active enrollment.",
    evidence: [
      { id: "eligibility_verification", label: "Real-time eligibility check result", description: "Screenshot or printout from your practice management system or clearinghouse showing active coverage on the exact date of service.", required: true },
      { id: "insurance_card", label: "Patient insurance card (front & back)", description: "Copy of insurance card presented at check-in.", required: true },
      { id: "enrollment_letter", label: "Payer enrollment confirmation", description: "Any letter from the payer confirming the patient's enrollment period.", required: false },
      { id: "coordination_of_benefits", label: "COB documentation", description: "If there is a COB issue, include both insurers' EOBs.", required: false },
    ],
    avoidanceNote: "Run eligibility checks at three points: at scheduling, 48 hours before the appointment, and at check-in. CO-27 is almost fully preventable.",
  },

  "26": {
    carcCode: "26",
    carcDescription: "Expenses incurred prior to coverage.",
    category: "Eligibility / Coverage",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "Moderate (50%)",
    coreArgument: "The patient's coverage was active by the date of service. Attached is the plan effective date confirmation and eligibility verification.",
    evidence: [
      { id: "eligibility_verification", label: "Eligibility verification showing effective date", description: "Proof that the plan effective date was on or before the date of service.", required: true },
      { id: "enrollment_letter", label: "Member enrollment letter", description: "Letter from the payer confirming when coverage began.", required: true },
    ],
    avoidanceNote: "Verify effective dates — not just active status — at scheduling for new patients.",
  },

  // ─── MEDICAL NECESSITY ─────────────────────────────────────────────────────
  "50": {
    carcCode: "50",
    carcDescription: "These are non-covered services because this is not deemed a medical necessity by the payer.",
    category: "Medical Necessity",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "Moderate (40%)",
    coreArgument: "The service was medically necessary under the payer's own coverage policy and met all applicable LCD/NCD criteria. Attached is the complete clinical documentation supporting the medical necessity determination.",
    evidence: [
      { id: "clinical_notes", label: "Complete clinical / SOAP notes", description: "All encounter notes documenting the patient's condition, history, and physician's clinical reasoning.", required: true },
      { id: "lcd_ncd_citation", label: "LCD or NCD citation", description: "Print the relevant Local Coverage Determination or National Coverage Determination and highlight the criteria met.", required: true },
      { id: "specialist_letter", label: "Referring physician / specialist letter", description: "If applicable, a letter from a specialist supporting the necessity of the service.", required: false },
      { id: "prior_treatment", label: "Prior treatment history", description: "Documentation showing conservative treatment was attempted and failed, if required by the LCD.", required: false },
      { id: "peer_to_peer_request", label: "Peer-to-peer review request", description: "Request a peer-to-peer review with the payer's medical director — many reversals happen here.", required: false },
    ],
    avoidanceNote: "Pull the payer's LCD for every high-risk CPT code. Documentation templates should map directly to LCD criteria before the claim is submitted.",
    urgencyNote: "Request a peer-to-peer review within 30 days of the denial — this is your highest-probability reversal path for medical necessity denials.",
  },

  "57": {
    carcCode: "57",
    carcDescription: "Payment denied/reduced because the payer deems the information submitted does not support this level of service.",
    category: "Medical Necessity",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "Moderate (45%)",
    coreArgument: "The level of service billed accurately reflects the work performed and is supported by documented time, medical decision-making complexity, and/or examination findings as required by CMS E/M guidelines.",
    evidence: [
      { id: "encounter_note", label: "Full encounter note with MDM documentation", description: "The note must explicitly document the number/complexity of problems, amount/complexity of data reviewed, and risk of complications.", required: true },
      { id: "em_guidelines", label: "CMS 2021 E/M guideline citation", description: "Reference the applicable CMS or AMA E/M documentation guidelines supporting the coded level.", required: true },
      { id: "time_documentation", label: "Total time documentation", description: "If billing by time: document total provider time including coordination, review, and counseling.", required: false },
    ],
    avoidanceNote: "Run E/M audits monthly. If CO-57 recurs, your documentation templates need revision — the level of MDM documented does not match the level billed.",
  },

  // ─── PRIOR AUTHORIZATION ───────────────────────────────────────────────────
  "15": {
    carcCode: "15",
    carcDescription: "Payment adjusted because the submitted authorization number is missing, invalid, or does not apply to the billed services.",
    category: "Prior Authorization",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (82%)",
    coreArgument: "A valid prior authorization was obtained for this service. Attached is the authorization approval confirmation including the authorization number, date of approval, authorized service, and authorized provider.",
    evidence: [
      { id: "pa_approval", label: "Prior authorization approval letter", description: "Written approval from the payer including: auth number, dates of validity, approved CPT code, and authorized provider NPI.", required: true },
      { id: "pa_request_confirmation", label: "PA request confirmation / case number", description: "Proof that the PA request was submitted and accepted before the date of service.", required: true },
      { id: "clinical_notes", label: "Clinical documentation submitted with PA", description: "The same supporting documentation that was submitted with the original PA request.", required: false },
      { id: "retroactive_pa", label: "Retroactive PA approval (if applicable)", description: "For urgent/emergent situations, request retroactive PA approval from the payer.", required: false },
    ],
    avoidanceNote: "PA tracking automation is critical. Build PA requirement checks into your scheduling workflow — never schedule a PA-required procedure without confirmation.",
  },

  // ─── TIMELY FILING ─────────────────────────────────────────────────────────
  "29": {
    carcCode: "29",
    carcDescription: "The time limit for filing has expired.",
    category: "Timely Filing",
    recoverable: false, // Timely filing is generally unrecoverable
    appealDeadlineDays: 0,
    winRateLabel: "Very Low (2%)",
    coreArgument: "Timely filing denials are rarely overturned unless you have proof of timely submission. The ONLY winnable argument: show the payer that the claim WAS submitted on time using clearinghouse logs.",
    evidence: [
      { id: "clearinghouse_report", label: "Clearinghouse acceptance report with original submission date", description: "This is your ONLY path. Must show the exact date the claim was transmitted, which must be within the payer's filing window.", required: true },
      { id: "system_logs", label: "Practice management system submission log", description: "Screenshot or export of your PM system showing when the claim was created and submitted.", required: false },
    ],
    avoidanceNote: "Timely filing is 100% preventable. Implement charge-lag alerts (flag any service date >15 days without a claim), and audit claim submission reports weekly.",
    urgencyNote: "CO-29 denials are almost never overturned without proof of timely submission. Focus your resources on prevention, not appeals for this code.",
  },

  // ─── DUPLICATE CLAIMS ──────────────────────────────────────────────────────
  "18": {
    carcCode: "18",
    carcDescription: "Duplicate claim/service.",
    category: "Duplicate Claims",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (70%+)",
    coreArgument: "This is not a duplicate. The services were rendered on different dates of service / are distinct procedures for different conditions. Attached is documentation distinguishing this claim from the alleged duplicate.",
    evidence: [
      { id: "original_eob", label: "EOB for the 'original' paid claim", description: "Obtain the claim number and date of service of the claim the payer says was already paid, and show how this claim is different.", required: true },
      { id: "encounter_notes", label: "Encounter notes for both services", description: "Show that the two services were genuinely distinct.", required: true },
      { id: "claim_comparison", label: "Side-by-side claim comparison", description: "Table showing the differences: date, CPT, diagnosis, rendering provider NPI.", required: false },
    ],
    avoidanceNote: "Duplicate denials can also mean a rebill was sent before the original was fully adjudicated. Implement a hold-before-rebill rule of 30 days.",
  },

  // ─── COORDINATION OF BENEFITS ──────────────────────────────────────────────
  "22": {
    carcCode: "22",
    carcDescription: "This care may be covered by another payer per coordination of benefits.",
    category: "Coordination of Benefits",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "High (75%+)",
    coreArgument: "COB has been established. The attached primary payer EOB shows this payer is the [primary/secondary] payer. Please reprocess as the [primary/secondary] payor responsible for this claim.",
    evidence: [
      { id: "primary_eob", label: "Primary payer EOB", description: "EOB from the primary payer showing what was paid and what the patient responsibility is.", required: true },
      { id: "cob_form", label: "COB / Other Insurance questionnaire", description: "Completed and signed COB questionnaire from the patient.", required: true },
      { id: "member_id", label: "Both insurance cards", description: "Front and back copies of both insurance cards.", required: false },
    ],
    avoidanceNote: "Collect and update COB information at every visit. Most practice management systems can flag patients with dual coverage.",
  },

  // ─── CONTRACTUAL / WRITE-OFF ───────────────────────────────────────────────
  "45": {
    carcCode: "45",
    carcDescription: "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
    category: "Contractual Adjustment",
    recoverable: false,
    appealDeadlineDays: 0,
    winRateLabel: "Not applicable",
    coreArgument: "This is a contractual rate reduction, not a denial. The payer paid the contracted rate. This is NOT recoverable through appeal — it is a write-off per your contract. The recovery opportunity is at contract renegotiation, not appeal.",
    evidence: [],
    avoidanceNote: "Review your fee schedule annually. If CO-45 write-offs represent more than 35% of gross charges, your billed charges are too high OR your contracted rates are below market. Both are fixable.",
    urgencyNote: "Do not appeal CO-45. Your time and your staff's time is better spent on actual denial categories. CO-45 is a contract issue, not a billing error.",
  },
};

/** Returns the evidence/appeal strategy for a given CARC code. Falls back to a generic strategy. */
export function getAppealStrategy(carcCode: string): AppealStrategy {
  return EVIDENCE_ENGINE[carcCode] ?? {
    carcCode,
    carcDescription: "Claim adjustment reason code " + carcCode,
    category: "Other",
    recoverable: true,
    appealDeadlineDays: 180,
    winRateLabel: "Variable",
    coreArgument: "Please review the attached clinical documentation and reprocess this claim. All required information has been provided.",
    evidence: [
      { id: "encounter_note", label: "Encounter / clinical notes", description: "Complete notes for the date of service.", required: true },
      { id: "eob", label: "Original remittance advice", description: "Copy of the EOB showing the specific reason for denial.", required: true },
    ],
    avoidanceNote: "Review payer policy for this denial code specifically.",
  };
}

/** Returns all CARC codes that are genuinely recoverable (worth appealing). */
export function recoverableCarcCodes(): string[] {
  return Object.entries(EVIDENCE_ENGINE)
    .filter(([, s]) => s.recoverable)
    .map(([code]) => code);
}

/** Returns true if a finding has at least one recoverable CARC code. */
export function findingIsAppealable(denialCodes: string[]): boolean {
  return denialCodes.some(code => (EVIDENCE_ENGINE[code]?.recoverable ?? true));
}

/** Generate an appeal letter body for a specific finding. */
export function generateAppealLetter(params: {
  practiceName: string;
  payerName: string;
  carcCode: string;
  claimIds: string[];
  cptCodes: string[];
  dollarAmount: number;
  dateOfService?: string;
}): string {
  const strategy = getAppealStrategy(params.carcCode);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const claimList = params.claimIds.slice(0, 10).join(", ") + (params.claimIds.length > 10 ? ` (and ${params.claimIds.length - 10} more)` : "");

  return `Date: ${today}

TO: ${params.payerName} — Appeals Department

FROM: ${params.practiceName} — Billing Department

RE: Formal Appeal — CARC ${params.carcCode} — ${params.claimIds.length} Claim(s)

Dear Appeals Reviewer,

We are writing to formally appeal the denial(s) of the following claim(s):

Claim Reference(s): ${claimList || "[Insert claim numbers]"}
Procedure Code(s): ${params.cptCodes.join(", ") || "[Insert CPT codes]"}
Date(s) of Service: ${params.dateOfService ?? "[Insert date range]"}
Total Amount in Dispute: $${params.dollarAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
Denial Reason Code: CARC ${params.carcCode} — "${strategy.carcDescription}"

BASIS FOR APPEAL
${strategy.coreArgument}

SUPPORTING DOCUMENTATION
The following documentation is attached in support of this appeal:
${strategy.evidence.filter(e => e.required).map((e, i) => `${i + 1}. ${e.label} — ${e.description}`).join("\n")}

We request that ${params.payerName} review this appeal and reprocess the above claim(s) for payment in accordance with our contractual agreement.

If additional information is needed, please contact our billing department immediately. We are committed to resolving this matter promptly.

Sincerely,

[Authorized Signature]
${params.practiceName}
[Phone Number]
[Fax Number]
[NPI: ___________]`;
}
