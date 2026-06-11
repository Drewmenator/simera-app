// Simera mock data — realistic numbers for a 4-physician family medicine group
// Annual revenue ~$2.4M, denial rate 14.2% (below industry median of 11.8%)

export const practiceStats = {
  name: "Riverview Family Medicine",
  providers: 4,
  specialty: "Family Medicine",
  lastUpdated: "May 31, 2026",
  dataRange: "Jan 2026 – May 2026",
};

export const headlineMetrics = {
  revenueAnalyzed: 487320,
  totalLeakage: 83440,
  expectedRecovery: 51136, // matches sum of leakageFindings.expectedRecovery (22464+14912+8880+4880+0)
  leakageRatePct: 17.1,
  denialRate: 14.2,
  denialGrade: "D",
  benchmarkMedian: 11.8,
  benchmarkBest: 5.2,
  netCollectionRate: 0.942,
  daysInAR: 34.2,
};

export const leakageFindings = [
  {
    rank: 1,
    category: "unworked_denial",
    label: "Unworked Denials",
    description: "CO-197 prior auth denials from United Healthcare — 23 claims never reworked",
    dollarAmount: 31200,
    expectedRecovery: 22464,
    recoveryProbability: 0.72,
    difficulty: "medium",
    payer: "United Healthcare",
    denialCodes: ["CO-197"],
    cptCodes: ["99214", "99215", "93000"],
    action: "Pull all CO-197 denials from UHC in the last 90 days. Submit retro-auth requests using the clinical notes attached to each claim. UHC accepts retro-auth up to 365 days post-service for established patients.",
  },
  {
    rank: 2,
    category: "underpayment",
    label: "Underpayments",
    description: "Aetna paying below contracted rates on 99214 and 99215 — systematic 12% shortfall",
    dollarAmount: 18640,
    expectedRecovery: 14912,
    recoveryProbability: 0.8,
    difficulty: "easy",
    payer: "Aetna",
    denialCodes: [],
    cptCodes: ["99214", "99215"],
    action: "Request itemized EOBs for all Aetna claims in Q1 2026. Compare against your 2025 fee schedule amendment (effective Jan 1, 2026). File a formal payment dispute referencing contract section 4.2.",
  },
  {
    rank: 3,
    category: "wrong_writeoff",
    label: "Wrong Write-offs",
    description: "CO-50 medical necessity write-offs that are clinically defensible with documentation",
    dollarAmount: 14800,
    expectedRecovery: 8880,
    recoveryProbability: 0.6,
    difficulty: "medium",
    payer: "Cigna",
    denialCodes: ["CO-50"],
    cptCodes: ["99215", "93042", "94010"],
    action: "Identify all CO-50 write-offs from Cigna in the past 6 months. Attach clinical documentation supporting medical necessity and resubmit as corrected claims within 180-day appeal window.",
  },
  {
    rank: 4,
    category: "undercoding",
    label: "Undercoding",
    description: "E&M distribution skews low — 78% of visits coded 99213 vs 52% specialty benchmark",
    dollarAmount: 12200,
    expectedRecovery: 4880,
    recoveryProbability: 0.4,
    difficulty: "hard",
    payer: "All Payers",
    denialCodes: [],
    cptCodes: ["99213", "99214"],
    action: "Schedule an internal coding review. Pull a random sample of 20 charts coded 99213. Use the 2021 AMA E&M guidelines — time-based coding may justify 99214 for many visits currently coded lower.",
  },
  {
    rank: 5,
    category: "timely_filing",
    label: "Timely Filing Losses",
    description: "CO-166 denials — 6 claims missed payer timely filing windows",
    dollarAmount: 6600,
    expectedRecovery: 0,
    recoveryProbability: 0.0,
    difficulty: "hard",
    payer: "Humana",
    denialCodes: ["CO-166"],
    cptCodes: ["99214", "99203"],
    action: "These claims are unrecoverable. Audit your clearinghouse submission timestamps against payer-specific filing windows. Humana requires submission within 90 days of service date.",
  },
];

export const denialPatterns = [
  {
    payer: "United Healthcare",
    code: "CO-197",
    description: "Prior authorization required",
    category: "Prior Authorization",
    claims: 23,
    atRisk: 31200,
    priority: "HIGH",
    trend: "up",
  },
  {
    payer: "Aetna",
    code: "CO-45",
    description: "Charge exceeds fee schedule",
    category: "Contractual",
    claims: 31,
    atRisk: 18640,
    priority: "HIGH",
    trend: "stable",
  },
  {
    payer: "Cigna",
    code: "CO-50",
    description: "Medical necessity not established",
    category: "Medical Necessity",
    claims: 14,
    atRisk: 14800,
    priority: "HIGH",
    trend: "up",
  },
  {
    payer: "Humana",
    code: "CO-166",
    description: "Timely filing deadline expired",
    category: "Timely Filing",
    claims: 6,
    atRisk: 6600,
    priority: "MEDIUM",
    trend: "down",
  },
  {
    payer: "United Healthcare",
    code: "CO-16",
    description: "Claim lacks required information",
    category: "Missing Information",
    claims: 9,
    atRisk: 5840,
    priority: "MEDIUM",
    trend: "stable",
  },
  {
    payer: "BCBS",
    code: "CO-22",
    description: "This care may be covered by another payer",
    category: "Coordination of Benefits",
    claims: 7,
    atRisk: 4200,
    priority: "LOW",
    trend: "down",
  },
];

export const payerScorecard = [
  {
    payer: "United Healthcare",
    claims: 218,
    denialRate: 21.1,
    grade: "F",
    netCollection: 91.2,
    atRisk: 37040,
    avgDaysToPayment: 28,
  },
  {
    payer: "Cigna",
    claims: 142,
    denialRate: 16.9,
    grade: "D",
    netCollection: 93.4,
    atRisk: 19600,
    avgDaysToPayment: 24,
  },
  {
    payer: "Aetna",
    claims: 186,
    denialRate: 12.4,
    grade: "C",
    netCollection: 94.1,
    atRisk: 21840,
    avgDaysToPayment: 21,
  },
  {
    payer: "Humana",
    claims: 98,
    denialRate: 9.2,
    grade: "B",
    netCollection: 96.8,
    atRisk: 6800,
    avgDaysToPayment: 18,
  },
  {
    payer: "BCBS",
    claims: 204,
    denialRate: 7.8,
    grade: "B",
    netCollection: 97.2,
    atRisk: 8400,
    avgDaysToPayment: 16,
  },
  {
    payer: "Medicare",
    claims: 312,
    denialRate: 4.5,
    grade: "A",
    netCollection: 98.9,
    atRisk: 5200,
    avgDaysToPayment: 14,
  },
];

// Monthly revenue trend (Jan–May 2026)
// leakage values scaled so they sum exactly to headlineMetrics.totalLeakage ($83,440)
// paid = billed − leakage; billed sums to revenueAnalyzed ($487,320)
export const revenueByMonth = [
  { month: "Jan", billed: 98400,  paid: 81470, denied: 11280, leakage: 16930 },
  { month: "Feb", billed: 91200,  paid: 75604, denied: 10440, leakage: 15596 },
  { month: "Mar", billed: 102800, paid: 85219, denied: 11520, leakage: 17581 },
  { month: "Apr", billed: 96600,  paid: 80080, denied: 10680, leakage: 16520 },
  { month: "May", billed: 98320,  paid: 81507, denied: 10856, leakage: 16813 },
  // sum: leakage 83,440 | billed 487,320 | paid 403,880
];

// CPT code analysis
export const cptAnalysis = [
  { code: "99213", description: "Office visit, est. patient, low complexity", billed: 412, avgPaid: 98.40, expected: 112.80, gap: 14.40, volume: "High" },
  { code: "99214", description: "Office visit, est. patient, mod. complexity", billed: 198, avgPaid: 142.60, expected: 162.40, gap: 19.80, volume: "High" },
  { code: "99215", description: "Office visit, est. patient, high complexity", billed: 47, avgPaid: 182.20, expected: 218.00, gap: 35.80, volume: "Low" },
  { code: "99203", description: "Office visit, new patient, low complexity", billed: 89, avgPaid: 118.40, expected: 134.20, gap: 15.80, volume: "Medium" },
  { code: "93000", description: "Electrocardiogram, routine", billed: 134, avgPaid: 22.10, expected: 28.40, gap: 6.30, volume: "Medium" },
];

// Benchmark comparison data — sourced from MGMA 2023-2024, HFMA, CAQH
export const benchmarks = {
  denialRate: {
    practice: 14.2,
    best: 3.0,          // best-in-class <3–5%
    median: 11.8,       // 2024 industry average (up from 10.2%)
    worst: 25.0,
    percentile: 22,
  },
  daysInAR: {
    practice: 34.2,
    best: 22,           // best-in-class <25 days
    median: 40,         // industry median 40–45 days
    worst: 65,
    percentile: 68,
  },
  netCollection: {
    practice: 94.2,
    best: 98.0,         // best-in-class ≥98%
    median: 95.0,       // MGMA benchmark ≥95%
    worst: 88.0,
    percentile: 42,
  },
  firstPassResolution: {
    practice: 71.4,
    best: 95.0,         // benchmark ≥95%
    median: 85.0,       // industry average ~85%
    worst: 55.0,
    percentile: 38,
  },
  cleanClaimRate: {
    practice: 82.0,
    best: 99.89,        // best-in-class
    median: 85.0,       // industry average
    worst: 65.0,
    percentile: 44,
  },
  costToCollect: {
    practice: 4.2,      // as % of net revenue
    best: 2.0,          // best-in-class <2%
    median: 3.5,        // industry average 3–4%
    worst: 8.0,         // high-denial orgs 6–8%+
    percentile: 35,
  },
};

// Industry benchmark tiers — sourced from MGMA 2023-2024, HFMA
export const benchmarkTiers = [
  {
    kpi: "Net Collection Rate",
    unit: "%",
    higherIsBetter: true,
    bestInClass: "≥98%",
    mgmaBenchmark: "≥95%",
    industryAvg: "90–94%",
    redFlag: "<90%",
    note: "90% vs 97% NCR on $5M revenue = $350K/year lost",
  },
  {
    kpi: "Days in A/R",
    unit: "days",
    higherIsBetter: false,
    bestInClass: "<25 days",
    mgmaBenchmark: "30–40 days",
    industryAvg: "40–45 days",
    redFlag: ">50 days",
    note: "10-day improvement on $3M practice = $82K accelerated cash",
  },
  {
    kpi: "Denial Rate",
    unit: "%",
    higherIsBetter: false,
    bestInClass: "<3–5%",
    mgmaBenchmark: "—",
    industryAvg: "11.8%",
    redFlag: ">15%",
    note: "MA denial rate 15.7%; commercial 13.9% (2024)",
  },
  {
    kpi: "Clean Claim Rate",
    unit: "%",
    higherIsBetter: true,
    bestInClass: "99.89%",
    mgmaBenchmark: "95%",
    industryAvg: "~85%",
    redFlag: "<75%",
    note: "Every 1% improvement = fewer denials + faster payment",
  },
  {
    kpi: "First Pass Resolution Rate",
    unit: "%",
    higherIsBetter: true,
    bestInClass: "≥95%",
    mgmaBenchmark: "≥95%",
    industryAvg: "~85%",
    redFlag: "<75%",
    note: "Reworked claims cost $57.23 each on average",
  },
  {
    kpi: "Cost to Collect",
    unit: "% of net rev",
    higherIsBetter: false,
    bestInClass: "<2%",
    mgmaBenchmark: "2%",
    industryAvg: "3–4%",
    redFlag: "6–8%+",
    note: "High-denial orgs spend 6–8% of net revenue to collect",
  },
];

// Revenue per physician by specialty (annual, MGMA 2024)
export const revenueBySpecialty = [
  { specialty: "Orthopedic Surgery", annualRevenue: 2700000 },
  { specialty: "Cardiology", annualRevenue: 2400000 },
  { specialty: "General Surgery", annualRevenue: 1750000 },
  { specialty: "Internal Medicine", annualRevenue: 1350000 },
  { specialty: "Family Medicine", annualRevenue: 1150000 },
  { specialty: "Pediatrics", annualRevenue: 1050000 },
];

// Denial taxonomy — industry-wide breakdown (MGMA / HFMA 2024)
export const denialTaxonomy = [
  {
    category: "Coding Errors",
    pctOfDenials: 28,
    topCARCs: ["CO-97", "CO-4", "CO-16", "CO-11"],
    recoveryRate: 50,
    recoveryNote: "40–60% with corrected resubmission",
    prevention: "NCCI scrubber + AI coding review",
    color: "#c2553d",
  },
  {
    category: "Eligibility / Coverage",
    pctOfDenials: 24,
    topCARCs: ["CO-27", "CO-29", "CO-31"],
    recoveryRate: 75,
    recoveryNote: "70–80% if patient was insured",
    prevention: "Real-time eligibility check at scheduling",
    color: "#bd852f",
  },
  {
    category: "Medical Necessity",
    pctOfDenials: 18,
    topCARCs: ["CO-50", "CO-57"],
    recoveryRate: 40,
    recoveryNote: "30–50%; requires physician appeal",
    prevention: "Documentation completeness check pre-submit",
    color: "#9a6a1e",
  },
  {
    category: "Prior Authorization",
    pctOfDenials: 13,
    topCARCs: ["CO-15"],
    recoveryRate: 82,
    recoveryNote: "81.7% overturned on appeal — most never appealed",
    prevention: "PA tracking automation",
    color: "#0b2734",
  },
  {
    category: "Timely Filing",
    pctOfDenials: 6,
    topCARCs: ["CO-29"],
    recoveryRate: 2,
    recoveryNote: "Near zero — essentially unrecoverable",
    prevention: "Charge lag monitoring + auto-alerts",
    color: "#5c747e",
  },
  {
    category: "Duplicate Claims",
    pctOfDenials: 7,
    topCARCs: ["CO-18"],
    recoveryRate: 0,
    recoveryNote: "100% avoidable — scrubber catch",
    prevention: "Duplicate claim scrubber",
    color: "#8aa0a8",
  },
  {
    category: "Credentialing",
    pctOfDenials: 7,
    topCARCs: ["CO-24", "CO-96", "PR-242"],
    recoveryRate: 15,
    recoveryNote: "Low recovery for non-credentialing period",
    prevention: "Credentialing expiry tracking",
    color: "#5c747e",
  },
];

// Appeal overturn rates by payer type
export const appealOverturnRates = [
  { payer: "Medicare Advantage", appealRate: "5–10%", overturnRate: 81.7, note: "Most never appealed" },
  { payer: "Commercial", appealRate: "Variable", overturnRate: 50, note: "40–60% overturned" },
  { payer: "Medicaid MCO", appealRate: "~11%", overturnRate: 46, note: "" },
  { payer: "ACA Marketplace", appealRate: "<1%", overturnRate: 44, note: "" },
];

// Risks / alerts
export const risks = [
  {
    id: "r1",
    severity: "critical",
    title: "23 UHC CO-197 denials approaching appeal deadline",
    description: "United Healthcare has a 180-day appeal window. 23 claims totaling $31,200 have been in denied status for 142 days. Appeal window closes in 38 days.",
    dollarAmount: 31200,
    deadline: "2026-07-08",
    action: "Submit retro-auth requests immediately",
    category: "Denial Deadline",
  },
  {
    id: "r2",
    severity: "critical",
    title: "Aetna contract amendment effective Jun 1 — rate increase not reflected",
    description: "Your 2026 Aetna contract includes a 4.2% fee schedule increase effective June 1. Your billing system still uses 2025 rates. Estimated impact: $2,100/month in lost revenue.",
    dollarAmount: 25200,
    deadline: "2026-06-15",
    action: "Update fee schedule in PM system",
    category: "Contract",
  },
  {
    id: "r3",
    severity: "high",
    title: "Cigna prior auth policy change — 14 new codes require auth starting Jul 1",
    description: "Cigna announced new prior authorization requirements effective July 1, 2026 for 14 CPT codes you use frequently, including 93000, 94010, and G0439.",
    dollarAmount: 18400,
    deadline: "2026-07-01",
    action: "Update auth workflow for affected codes",
    category: "Payer Policy",
  },
  {
    id: "r4",
    severity: "high",
    title: "Days in AR trending up — 28d → 34d over 90 days",
    description: "Your average days in accounts receivable has increased by 6 days over the past 3 months. Primary driver: UHC claim processing delays. Industry median is 38 days, but your trajectory is concerning.",
    dollarAmount: 8200,
    deadline: null,
    action: "Audit UHC claim processing queue",
    category: "Cash Flow",
  },
  {
    id: "r5",
    severity: "medium",
    title: "6 claims missed timely filing — workflow gap detected",
    description: "6 Humana claims were denied for timely filing in May. All originated from same provider (Dr. Chen) and same front desk workflow. Pattern suggests a systematic documentation gap.",
    dollarAmount: 6600,
    deadline: null,
    action: "Audit Dr. Chen front desk workflow",
    category: "Workflow",
  },
  {
    id: "r6",
    severity: "medium",
    title: "E&M distribution outlier detected — undercoding risk",
    description: "78% of your E&M visits are coded at 99213, vs 52% specialty benchmark. This outlier pattern is a coding audit red flag and represents potential lost revenue of ~$2,400/month.",
    dollarAmount: 12200,
    deadline: null,
    action: "Schedule internal coding review",
    category: "Coding",
  },
];

// AI conversation starters — includes CARC-specific and benchmark questions
export const aiSuggestions = [
  "What's the fastest $10K I can recover this week?",
  "Why is United Healthcare denying so many prior auth claims?",
  "What should I focus on this month?",
  "What's a good denial rate for my specialty?",
  "CO-50 denials from Cigna — should I appeal, and what's the success rate?",
  "Which payer is the most profitable after denials?",
  "What does CO-97 mean and how do I fix it?",
  "How much revenue am I losing to underpayments?",
  "What is my denial rate grade and how do I improve it?",
  "How do my Days in A/R compare to the MGMA benchmark?",
];
