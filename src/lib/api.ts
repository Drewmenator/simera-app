/**
 * Simera API client
 * Connects the Next.js frontend to the FastAPI backend.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point at your API.
 * Falls back to mock data when API is unavailable (for demos).
 */

const CLOUD_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SPARK_URL = "http://localhost:8000";

/**
 * Returns the active API base URL — called fresh on every request.
 * If a Spark Agent was detected (cached in sessionStorage by use-spark.ts),
 * routes to local agent instead of cloud. PHI stays on-prem.
 */
function apiUrl(): string {
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("simera_spark_detected");
      if (cached) {
        const { detected } = JSON.parse(cached);
        if (detected) return SPARK_URL;
      }
    } catch { /* ignore */ }
  }
  return CLOUD_API_URL;
}

export interface AuditHeadline {
  total_revenue_analyzed: number;
  total_leakage: number;
  leakage_rate_pct: number;
  expected_recovery: number;
  denial_rate_pct: number;
  denial_grade: string;
  benchmark_denial_rate_median: number;
  benchmark_denial_rate_best: number;
}

export interface AuditFinding {
  rank: number;
  category: string;
  description: string;
  dollar_amount: number;
  recovery_probability: number;
  expected_recovery: number;
  difficulty: string;
  recommended_action: string;
  payer_name: string;
  denial_codes: string[];
  cpt_codes: string[];
  /** Practice-internal billing reference numbers (NOT PHI). Used in appeal packages. */
  claim_ids?: string[];
  /** Total number of claims in this finding (may be larger than claim_ids if >50). */
  claim_count?: number;
}

export interface DenialPattern {
  payer_name: string;
  denial_code: string;
  denial_description: string;
  category: string;
  claim_count: number;
  total_at_risk: number;
  priority: string;
  affected_cpt_codes: string[];
}

export interface PayerScore {
  payer_name: string;
  total_claims: number;
  denial_rate_pct: number;
  denial_grade: string;
  net_collection_rate_pct: number;
}

export interface AuditResult {
  practice_name: string;
  generated_at: string;
  analysis_period: { start: string | null; end: string | null; days: number };
  headline: AuditHeadline;
  top_findings: AuditFinding[];
  denial_patterns: DenialPattern[];
  payer_scorecard: PayerScore[];
}

export interface AuditRunSummary {
  id: string;
  practice_name: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

/**
 * Optional token getter from Clerk's useAuth() hook.
 * Components should pass their getToken() in for reliable auth — the
 * window.Clerk global fallback is unreliable (session can be null mid-load).
 */
export type TokenGetter = () => Promise<string | null>;

export async function getAuthHeaders(getToken?: TokenGetter): Promise<HeadersInit> {
  // Preferred: token from the Clerk useAuth() hook passed by the caller
  if (getToken) {
    try {
      const token = await getToken();
      if (token) return { Authorization: `Bearer ${token}` };
    } catch {
      // fall through to window.Clerk fallback
    }
  }
  // Fallback: window.Clerk global (less reliable)
  try {
    if (typeof window !== "undefined" && (window as any).Clerk) {
      const w = (window as any).Clerk;
      // Ensure Clerk is loaded before reading session
      if (w.loaded === false && typeof w.load === "function") {
        await w.load();
      }
      const token = await w.session?.getToken();
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // not signed in or Clerk not loaded
  }
  return {};
}

/**
 * Fetch the list of all completed audits for the authenticated user.
 * Returns an empty array if none exist or user is not signed in.
 */
export async function listAuditHistory(): Promise<AuditRunSummary[]> {
  const headers = await getAuthHeaders();
  if (!("Authorization" in headers)) return [];

  try {
    const res = await fetch(`${apiUrl()}/audit/history`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.audits ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a specific audit result by run ID.
 * Returns null if not found or not owned by the user.
 */
export async function getAuditById(runId: string): Promise<AuditResult | null> {
  const headers = await getAuthHeaders();
  if (!("Authorization" in headers)) return null;

  try {
    const res = await fetch(`${apiUrl()}/audit/${runId}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch the user's most recent audit result from the server.
 * Returns null if none exists or user is not signed in.
 */
export async function getLatestAudit(): Promise<AuditResult | null> {
  const headers = await getAuthHeaders();
  if (!("Authorization" in headers)) return null;

  try {
    const res = await fetch(`${apiUrl()}/audit/latest`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Upload one or more 835 ERA files and get a full audit back.
 */
export async function uploadAudit(
  files: File[],
  practiceName: string = "Your Practice",
  specialty: string = "primary_care"
): Promise<AuditResult> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  form.append("practice_name", practiceName);
  form.append("specialty", specialty);

  const res = await fetch(`${apiUrl()}/audit/835`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

export interface AuditJob {
  job_id?: string;
  status: "processing" | "complete" | "error";
  result?: AuditResult;
  message?: string;
}

/**
 * Upload one or more 835 ERA files and start an async audit job.
 * Returns the job_id to poll with pollAuditJob().
 */
export async function uploadAuditAsync(
  files: File[],
  practiceName: string = "Your Practice",
  specialty: string = "primary_care",
  getToken?: TokenGetter
): Promise<string> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }
  form.append("practice_name", practiceName);
  form.append("specialty", specialty);

  const headers = await getAuthHeaders(getToken);

  // Spark Agent is local — no Clerk auth needed (it uses its own JWT or none)
  const sparkActive = (() => {
    try {
      const c = typeof window !== "undefined" ? sessionStorage.getItem("simera_spark_detected") : null;
      return c ? JSON.parse(c).detected === true : false;
    } catch { return false; }
  })();

  if (!("Authorization" in headers) && !sparkActive) {
    throw new Error("Not signed in — please refresh the page and try again.");
  }

  const res = await fetch(`${apiUrl()}/audit/835/async`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  const data = await res.json();
  return data.job_id as string;
}

/**
 * Poll the status of an async audit job.
 */
export async function pollAuditJob(jobId: string, getToken?: TokenGetter): Promise<AuditJob> {
  const res = await fetch(`${apiUrl()}/audit/jobs/${jobId}`, {
    method: "GET",
    headers: await getAuthHeaders(getToken),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `API error ${res.status}` }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  return res.json();
}

/**
 * Quick preview — parse a single file without full analysis.
 */
export async function previewAudit(file: File): Promise<{
  payer: string;
  claims: number;
  denied: number;
  total_paid: number;
}> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${apiUrl()}/audit/835/preview`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stream a chat response from Simera AI.
 * Yields text chunks as they arrive from the API.
 * Pass the full AuditResult as auditContext for personalized answers.
 */
export async function streamChat(
  messages: ChatMessage[],
  auditContext: AuditResult | null,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const headers = await getAuthHeaders();

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}/chat`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        audit_context: auditContext ?? null,
      }),
    });
  } catch {
    onError("Network error. Check your connection.");
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `API error ${res.status}` }));
    onError(err.detail ?? `API error ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) { onError("No response body."); return; }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  onDone();
}

/**
 * Health check — returns true if the API is reachable.
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl()}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface AppealLetterRequest {
  finding_label: string;
  payer_name: string;
  denial_codes: string[];
  dollar_amount: number;
  expected_recovery: number;
  description: string;
  recommended_action: string;
  practice_name: string;
  cpt_codes: string[];
  /** Claim reference numbers from the 835 (internal billing IDs, not PHI). Included in the letter. */
  claim_ids?: string[];
}

export interface AppealLetterResponse {
  letter: string;
  subject_line: string;
}

export async function generateAppealLetter(req: AppealLetterRequest, getToken?: TokenGetter): Promise<AppealLetterResponse> {
  const res = await fetch(`${apiUrl()}/appeal-letter`, {
    method: "POST",
    headers: { ...await getAuthHeaders(getToken), "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface BillingStatus {
  plan: "free" | "starter" | "growth";
  status: "active" | "past_due" | "canceled" | "trialing";
  current_period_end: string | null;
}

/**
 * Fetch the current subscription status for the authenticated user.
 * Returns null if not signed in or on fetch error.
 */
export async function getBillingStatus(): Promise<BillingStatus | null> {
  const headers = await getAuthHeaders();
  if (!("Authorization" in headers)) return null;

  try {
    const res = await fetch(`${apiUrl()}/billing/status`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Create a Stripe Checkout session for the given plan.
 * Returns the hosted Checkout URL to redirect the user to.
 */
export async function createCheckoutSession(plan: "starter" | "growth" | "enterprise"): Promise<string> {
  const res = await fetch(`${apiUrl()}/billing/checkout`, {
    method: "POST",
    headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.url as string;
}

/**
 * Create a Stripe Customer Portal session.
 * Returns the portal URL to redirect the user to.
 */
export async function createPortalSession(): Promise<string> {
  const res = await fetch(`${apiUrl()}/billing/portal`, {
    method: "POST",
    headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.url as string;
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  member_email: string;
  member_name: string | null;
  role: string;
  invited_at: string;
  accepted_at: string | null;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const headers = await getAuthHeaders();
  if (!("Authorization" in headers)) return [];
  try {
    const res = await fetch(`${apiUrl()}/team`, { method: "GET", headers, cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.members ?? [];
  } catch {
    return [];
  }
}

export async function inviteTeamMember(email: string, name: string, role: string): Promise<void> {
  const res = await fetch(`${apiUrl()}/team/invite`, {
    method: "POST",
    headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
}

export async function removeTeamMember(email: string): Promise<void> {
  const res = await fetch(`${apiUrl()}/team/member/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
}

// ── BAA ───────────────────────────────────────────────────────────────────────

export async function acceptBaa(data: {
  userEmail: string;
  userName?: string;
  organization?: string;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${apiUrl()}/baa/accept`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      user_email: data.userEmail,
      user_name: data.userName,
      organization: data.organization,
    }),
  });
  if (!res.ok) throw new Error("Failed to record BAA acceptance.");
}

export async function getBaaStatus(): Promise<{ has_baa: boolean; accepted_at?: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${apiUrl()}/baa/status`, { headers });
  if (!res.ok) return { has_baa: false };
  return res.json();
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export interface PracticeSetupPayload {
  practice_name: string;
  specialty: string;
  state: string;
  provider_count: string;
  billing_npi: string;
}

export interface PracticeSetupResponse {
  practice_id: string;
  practice_name: string;
}

export async function setupPractice(data: PracticeSetupPayload): Promise<PracticeSetupResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${apiUrl()}/onboarding/practice`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Practice settings (Settings → Practice tab) ──────────────────────────────

export interface PracticeSettings {
  id?: string;
  name?: string;
  specialty?: string;
  npi?: string;
  state?: string;
  provider_count?: string;
  tax_id?: string;
  timezone?: string;
}

export async function getPracticeSettings(getToken?: TokenGetter): Promise<PracticeSettings | null> {
  const headers = await getAuthHeaders(getToken);
  if (!("Authorization" in headers)) return null;
  try {
    const res = await fetch(`${apiUrl()}/practice`, { headers, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.practice ?? null;
  } catch {
    return null;
  }
}

export async function savePracticeSettings(settings: PracticeSettings, getToken?: TokenGetter): Promise<PracticeSettings> {
  const headers = await getAuthHeaders(getToken);
  const res = await fetch(`${apiUrl()}/practice`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  const data = await res.json();
  return data.practice ?? settings;
}

export async function getAthenaConnectUrl(): Promise<{ auth_url: string; message: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${apiUrl()}/adapters/athenahealth/connect`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function linkTeamMember(practiceOwnerEmail: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${apiUrl()}/team/link`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ practice_owner_email: practiceOwnerEmail }),
  });
  if (!res.ok) throw new Error("Failed to link team member.");
}
