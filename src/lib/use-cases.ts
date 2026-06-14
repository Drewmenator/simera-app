"use client";

/**
 * use-cases — client hook for the persisted denial work queue (Phase 1 spine).
 *
 * Reads the live `/cases` API (the `findings`-as-case-record backend) and lets a
 * practice advance a case through the recovery lifecycle. Distinct from the
 * in-memory DenialWorkQueue (which renders the current audit's findings): these
 * are server-persisted cases whose status survives reloads.
 *
 * Cases only appear once an 835 audit has been run and persisted; in pure demo
 * mode this list is empty (handled by the UI's empty state).
 */

import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const CASE_STATUSES = [
  "new",
  "triaged",
  "artifact_generated",
  "in_review",
  "submitted",
  "awaiting_payer",
  "resolved_paid",
  "resolved_partial",
  "resolved_denied",
  "abandoned",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

/** Display metadata for each lifecycle state. `phase` groups the queue. */
export const STATUS_META: Record<
  CaseStatus,
  { label: string; phase: "open" | "in_flight" | "resolved"; color: string }
> = {
  new:                { label: "New",               phase: "open",      color: "bg-slate-500/15 text-slate-600 border-slate-200" },
  triaged:            { label: "Triaged",           phase: "open",      color: "bg-blue-500/15 text-blue-600 border-blue-200" },
  artifact_generated: { label: "Package built",     phase: "in_flight", color: "bg-indigo-500/15 text-indigo-600 border-indigo-200" },
  in_review:          { label: "In review",         phase: "in_flight", color: "bg-violet-500/15 text-violet-600 border-violet-200" },
  submitted:          { label: "Submitted",         phase: "in_flight", color: "bg-amber-500/15 text-amber-700 border-amber-200" },
  awaiting_payer:     { label: "Awaiting payer",    phase: "in_flight", color: "bg-yellow-500/15 text-yellow-700 border-yellow-200" },
  resolved_paid:      { label: "Recovered",         phase: "resolved",  color: "bg-emerald-500/15 text-emerald-600 border-emerald-200" },
  resolved_partial:   { label: "Partially paid",    phase: "resolved",  color: "bg-teal-500/15 text-teal-600 border-teal-200" },
  resolved_denied:    { label: "Denied (final)",    phase: "resolved",  color: "bg-red-500/15 text-red-600 border-red-200" },
  abandoned:          { label: "Abandoned",         phase: "resolved",  color: "bg-gray-400/15 text-gray-500 border-gray-200" },
};

export interface DenialCase {
  id: string;
  audit_run_id: string | null;
  category: string | null;
  payer_name: string | null;
  payer_id: string | null;
  dollar_amount: number | null;
  billed_amount: number | null;
  expected_recovery: number | null;
  recovered_amount: number | null;
  status: CaseStatus;
  denial_reason_code: string | null;
  remark_code: string | null;
  denial_category: string | null;
  recoverability_score: number | null;
  timely_filing_deadline: string | null;
  submission_method: string | null;
  submission_ref: string | null;
  assigned_to: string | null;
  claim_id: string | null;
  finding_key: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CaseTimelineEntry {
  old_status: string | null;
  new_status: string;
  recovered_amount: number | null;
  changed_at: string;
}

export type CaseSort = "deadline" | "dollars" | "recoverability";

export interface UpdateCaseInput {
  status: CaseStatus;
  recovered_amount?: number;
  submission_method?: string;
  submission_ref?: string;
  assigned_to?: string;
}

export function useCases(opts: { sort?: CaseSort; status?: CaseStatus } = {}) {
  const { sort = "deadline", status } = opts;
  const [cases, setCases] = useState<DenialCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({ sort });
      if (status) params.set("status", status);
      const res = await fetch(`${API_URL}/cases?${params.toString()}`, { headers });
      if (!res.ok) {
        // 401 in demo / signed-out, 503 if persistence unconfigured — treat as empty.
        setCases([]);
        if (res.status !== 401 && res.status !== 503) {
          setError(`Failed to load cases (${res.status})`);
        }
        return;
      }
      const data = await res.json();
      setCases((data.cases ?? []) as DenialCase[]);
    } catch {
      setCases([]);
      setError("Network error loading cases");
    } finally {
      setIsLoading(false);
    }
  }, [sort, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (caseId: string, input: UpdateCaseInput): Promise<boolean> => {
      try {
        const headers = {
          ...(await getAuthHeaders()),
          "Content-Type": "application/json",
        };
        const res = await fetch(`${API_URL}/cases/${caseId}/status`, {
          method: "POST",
          headers,
          body: JSON.stringify(input),
        });
        if (!res.ok) return false;
        // Optimistic local update so the UI reflects the new state immediately.
        setCases((prev) =>
          prev.map((c) =>
            c.id === caseId
              ? {
                  ...c,
                  status: input.status,
                  recovered_amount: input.recovered_amount ?? c.recovered_amount,
                  submission_method: input.submission_method ?? c.submission_method,
                  submission_ref: input.submission_ref ?? c.submission_ref,
                }
              : c
          )
        );
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return { cases, isLoading, error, refresh, updateStatus };
}

/** Fetch a single case with its status-change timeline. */
export async function fetchCaseDetail(
  caseId: string
): Promise<(DenialCase & { timeline: CaseTimelineEntry[] }) | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/cases/${caseId}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.case ?? null;
  } catch {
    return null;
  }
}
