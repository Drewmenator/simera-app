/**
 * Client-side X12 835 EDI validator.
 *
 * Runs entirely in the browser — no PHI leaves the machine until the user
 * explicitly submits. Provides structural validation and a rich preview
 * (payer, payee, payment date, claim count, total paid) before the upload.
 *
 * Design rules:
 *   - Never throws; always returns a ParseResult
 *   - Warnings are advisory; errors block submission
 *   - Works on multi-file batches (call parse835File per file, then merge)
 */

export interface ValidationCheck {
  id: string;
  label: string;
  /** "pass" | "warn" | "fail" | "skip" */
  status: "pass" | "warn" | "fail" | "skip";
  detail?: string;
}

export interface ParseResult {
  /** Whether this file is safe to submit for full analysis */
  valid: boolean;
  /** Hard failures that would likely cause the API to reject the file */
  errorCount: number;
  /** Advisory issues that won't block but deserve attention */
  warnCount: number;
  checks: ValidationCheck[];

  // Preview data (undefined if file is too broken to extract)
  payerName?: string;
  payeeName?: string;
  paymentDate?: string;   // YYYYMMDD raw
  totalPaid?: number;     // BPR02
  claimCount?: number;
  controlNumber?: string; // ISA13
}

// ─────────────────────────────────────────────────────────────────────────────

function pass(id: string, label: string, detail?: string): ValidationCheck {
  return { id, label, status: "pass", detail };
}
function warn(id: string, label: string, detail?: string): ValidationCheck {
  return { id, label, status: "warn", detail };
}
function fail(id: string, label: string, detail?: string): ValidationCheck {
  return { id, label, status: "fail", detail };
}
function skip(id: string, label: string, detail?: string): ValidationCheck {
  return { id, label, status: "skip", detail };
}

// ─────────────────────────────────────────────────────────────────────────────

export function parse835Text(text: string): ParseResult {
  const checks: ValidationCheck[] = [];
  let errorCount = 0;
  let warnCount = 0;

  const addCheck = (c: ValidationCheck) => {
    checks.push(c);
    if (c.status === "fail") errorCount++;
    if (c.status === "warn") warnCount++;
  };

  const result: Omit<ParseResult, "valid" | "errorCount" | "warnCount" | "checks"> = {};

  // ── 1. Non-empty ───────────────────────────────────────────────────────────
  const raw = text.trim();
  if (raw.length === 0) {
    addCheck(fail("empty", "File is not empty", "File contains no content"));
    return { valid: false, errorCount, warnCount, checks };
  }
  addCheck(pass("empty", "File is not empty", `${raw.length.toLocaleString()} characters`));

  // ── 2. ISA segment ─────────────────────────────────────────────────────────
  if (!raw.startsWith("ISA")) {
    addCheck(fail("isa_start", "ISA header found", "File must begin with ISA — this may not be an X12 835"));
    return { valid: false, errorCount, warnCount, checks };
  }

  // Detect element delimiter (char at position 3)
  const elemDel = raw[3];
  // Detect segment terminator (char at position 105)
  const segTerm = raw.length > 105 ? raw[105] : undefined;

  if (!segTerm) {
    addCheck(fail("isa_length", "ISA segment length (106 chars)", `ISA is only ${raw.length} chars — expected at least 106`));
    return { valid: false, errorCount, warnCount, checks };
  }
  addCheck(pass("isa_start", "ISA header found", `Element delimiter: '${elemDel === "\n" ? "\\n" : elemDel}' · Segment terminator: '${segTerm === "\n" ? "\\n" : segTerm}'`));

  // Split into segments
  const rawSegTerm = segTerm;
  // Segment terminator may be followed by newline — handle both
  let segments: string[];
  if (rawSegTerm === "\n") {
    segments = raw.split("\n").map(s => s.trim()).filter(Boolean);
  } else {
    segments = raw.split(rawSegTerm).map(s => s.trim()).filter(Boolean);
  }

  const getFields = (seg: string) => seg.split(elemDel);

  // ── 3. ISA field count ─────────────────────────────────────────────────────
  const isaFields = getFields(segments[0]);
  if (isaFields.length < 16) {
    addCheck(fail("isa_fields", "ISA has 16 fields", `Found ${isaFields.length} — expected 16`));
  } else {
    addCheck(pass("isa_fields", "ISA has 16 fields"));
    result.controlNumber = isaFields[13]?.trim();
  }

  // ── 4. IEA (ISA close) ────────────────────────────────────────────────────
  const ieaSeg = segments.find(s => s.startsWith("IEA"));
  addCheck(
    ieaSeg
      ? pass("iea", "IEA envelope close found")
      : fail("iea", "IEA envelope close found", "Missing IEA — file may be truncated")
  );

  // ── 5. GS/GE functional group ─────────────────────────────────────────────
  const gsSeg  = segments.find(s => s.startsWith("GS"));
  const geSeg  = segments.find(s => s.startsWith("GE"));
  if (!gsSeg) {
    addCheck(fail("gs", "GS functional group header found", "Missing GS segment"));
  } else {
    const gsFields = getFields(gsSeg);
    const functionalIdCode = gsFields[1]?.trim();
    addCheck(
      functionalIdCode === "HP"
        ? pass("gs", "GS functional group is 835 (HP)", `Group ID: ${result.controlNumber ?? "—"}`)
        : warn("gs", "GS functional group is 835 (HP)", `Functional ID code is '${functionalIdCode}' — expected 'HP' for 835`)
    );
  }
  addCheck(
    geSeg
      ? pass("ge", "GE functional group close found")
      : fail("ge", "GE functional group close found", "Missing GE — file may be truncated")
  );

  // ── 6. ST 835 transaction ─────────────────────────────────────────────────
  const stSeg = segments.find(s => {
    const f = getFields(s);
    return f[0] === "ST" && f[1]?.trim() === "835";
  });
  addCheck(
    stSeg
      ? pass("st835", "ST 835 transaction set found")
      : fail("st835", "ST 835 transaction set found", "No ST*835 segment — this may not be an 835 remittance file")
  );

  if (!stSeg) {
    // Check if it's a different transaction type
    const stAny = segments.find(s => s.startsWith("ST" + elemDel));
    if (stAny) {
      const stFields = getFields(stAny);
      addCheck(warn("st_type", "Transaction type check", `Found ST*${stFields[1]?.trim()} — expected ST*835`));
    }
    return { valid: false, errorCount, warnCount, checks, ...result };
  }

  // ── 7. SE (ST close) ──────────────────────────────────────────────────────
  const seSeg = segments.find(s => s.startsWith("SE" + elemDel));
  addCheck(
    seSeg
      ? pass("se", "SE transaction set close found")
      : warn("se", "SE transaction set close found", "Missing SE — file may be truncated but still parseable")
  );

  // ── 8. BPR (payment detail) ───────────────────────────────────────────────
  const bprSeg = segments.find(s => s.startsWith("BPR" + elemDel));
  if (!bprSeg) {
    addCheck(fail("bpr", "BPR payment detail segment found", "Missing BPR — cannot determine payment amount"));
  } else {
    const bprFields = getFields(bprSeg);
    const amt = parseFloat(bprFields[2] ?? "");
    if (!isNaN(amt)) {
      result.totalPaid = amt;
      addCheck(pass("bpr", "BPR payment detail found", `Total paid: $${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`));
    } else {
      addCheck(warn("bpr", "BPR payment detail found", "Could not parse payment amount from BPR02"));
    }
    // Extract payment date from BPR16
    const rawDate = bprFields[16]?.trim();
    if (rawDate && rawDate.length === 8 && /^\d{8}$/.test(rawDate)) {
      result.paymentDate = rawDate;
    }
  }

  // ── 9. TRN (trace number) ─────────────────────────────────────────────────
  const trnSeg = segments.find(s => s.startsWith("TRN" + elemDel));
  addCheck(
    trnSeg
      ? pass("trn", "TRN trace/check number found")
      : skip("trn", "TRN trace/check number found", "No TRN — check number may be missing")
  );

  // ── 10. N1 payer / payee ──────────────────────────────────────────────────
  const n1Segs = segments.filter(s => s.startsWith("N1" + elemDel));
  let foundPR = false, foundPE = false;
  for (const n1 of n1Segs) {
    const f = getFields(n1);
    if (f[1]?.trim() === "PR") {
      result.payerName = f[2]?.trim();
      foundPR = true;
    }
    if (f[1]?.trim() === "PE") {
      result.payeeName = f[2]?.trim();
      foundPE = true;
    }
  }
  addCheck(foundPR
    ? pass("n1_pr", "Payer name (N1*PR) found", result.payerName)
    : warn("n1_pr", "Payer name (N1*PR) found", "No payer identified — common in some ERA formats"));
  addCheck(foundPE
    ? pass("n1_pe", "Payee/provider name (N1*PE) found", result.payeeName)
    : skip("n1_pe", "Payee/provider name (N1*PE) found", "No payee segment — optional in many 835s"));

  // ── 11. CLP segments (claim-level detail) ────────────────────────────────
  const clpSegs = segments.filter(s => s.startsWith("CLP" + elemDel));
  result.claimCount = clpSegs.length;
  if (clpSegs.length === 0) {
    addCheck(fail("clp", "CLP claim segments found", "No CLP segments — no claim-level data to analyze"));
  } else {
    addCheck(pass("clp", "CLP claim segments found", `${clpSegs.length} claim${clpSegs.length !== 1 ? "s" : ""} in file`));
  }

  // ── 12. SVC segments (service-line adjustments) ───────────────────────────
  const svcSegs = segments.filter(s => s.startsWith("SVC" + elemDel));
  addCheck(
    svcSegs.length > 0
      ? pass("svc", "SVC service-line segments found", `${svcSegs.length} service line${svcSegs.length !== 1 ? "s" : ""}`)
      : warn("svc", "SVC service-line segments found", "No SVC segments — CPT-level detail unavailable; analysis will be claim-level only")
  );

  // ── 13. CAS (adjustment reason codes) ────────────────────────────────────
  const casSegs = segments.filter(s => s.startsWith("CAS" + elemDel));
  addCheck(
    casSegs.length > 0
      ? pass("cas", "CAS adjustment/denial codes found", `${casSegs.length} adjustment segment${casSegs.length !== 1 ? "s" : ""}`)
      : warn("cas", "CAS adjustment/denial codes found", "No CAS segments — denial reason codes unavailable; leakage detection will be limited")
  );

  // ── 14. Date validity ─────────────────────────────────────────────────────
  if (result.paymentDate) {
    const y = parseInt(result.paymentDate.slice(0, 4));
    const m = parseInt(result.paymentDate.slice(4, 6)) - 1;
    const d = parseInt(result.paymentDate.slice(6, 8));
    const dt = new Date(y, m, d);
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

    if (dt > now) {
      addCheck(warn("date_future", "Payment date is not in the future",
        `Payment date ${result.paymentDate} is in the future — verify this is correct`));
    } else if (dt < twoYearsAgo) {
      addCheck(warn("date_old", "Payment date within 2 years",
        `Payment date ${result.paymentDate} is over 2 years ago — timely filing deadlines may apply`));
    } else {
      const formatted = dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      addCheck(pass("date_valid", "Payment date valid", formatted));
    }
  } else {
    addCheck(skip("date_valid", "Payment date valid", "Could not extract payment date from BPR"));
  }

  // ── 15. Duplicate control number (sessionStorage cache) ──────────────────
  if (result.controlNumber && typeof window !== "undefined") {
    const seenKey = "simera:seen_isa_controls";
    let seen: string[] = [];
    try { seen = JSON.parse(sessionStorage.getItem(seenKey) ?? "[]"); } catch { /* */ }

    if (seen.includes(result.controlNumber)) {
      addCheck(warn("dup_control", "No duplicate ISA control number",
        `Control number ${result.controlNumber} was already uploaded this session — possible duplicate`));
    } else {
      addCheck(pass("dup_control", "No duplicate ISA control number", `ISA13: ${result.controlNumber}`));
      seen.push(result.controlNumber);
      try { sessionStorage.setItem(seenKey, JSON.stringify(seen.slice(-50))); } catch { /* */ }
    }
  } else {
    addCheck(skip("dup_control", "No duplicate ISA control number", "Cannot check — control number not found"));
  }

  // ── Result ────────────────────────────────────────────────────────────────
  const valid = errorCount === 0;
  return { valid, errorCount, warnCount, checks, ...result };
}

/**
 * Read a File object and parse it as X12 835.
 * Returns a ParseResult — never throws.
 */
export async function parse835File(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return parse835Text(text);
  } catch (e) {
    return {
      valid: false,
      errorCount: 1,
      warnCount: 0,
      checks: [fail("read", "File readable", String(e))],
    };
  }
}
