"use client";

/**
 * use-artifacts — client hook for a denial case's recovery artifacts (Phase 2).
 *
 * Reads /cases/{id}/artifacts and exposes generate / regenerate / review actions
 * (the human-approval gate). Mirrors use-cases.ts auth/fetch conventions. Artifacts
 * exist only after a "Build package" action; empty otherwise.
 */

import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ArtifactType = "corrected_claim" | "appeal_letter" | "records_checklist";
export type ArtifactStatus = "draft" | "approved" | "rejected";

export interface CaseArtifact {
  id: string;
  case_id: string;
  type: ArtifactType;
  required: boolean;
  status: ArtifactStatus;
  transmittable: boolean | null;
  generated_payload: Record<string, unknown>;
  final_payload: Record<string, unknown> | null;
  generated_by: string | null;
  reviewed_by: string | null;
}

export function useArtifacts(caseId: string | null) {
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cases/${caseId}/artifacts`, { headers });
      setArtifacts(res.ok ? ((await res.json()).artifacts ?? []) : []);
    } catch { setArtifacts([]); } finally { setIsLoading(false); }
  }, [caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  const post = useCallback(async (path: string, body?: unknown) => {
    const headers = { ...(await getAuthHeaders()), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST", headers, body: body ? JSON.stringify(body) : undefined,
    });
    await refresh();
    return res.ok;
  }, [refresh]);

  const generate = useCallback(
    () => (caseId ? post(`/cases/${caseId}/artifacts`) : Promise.resolve(false)),
    [post, caseId]
  );
  const regenerate = useCallback(
    (force = false) =>
      caseId ? post(`/cases/${caseId}/artifacts/regenerate?force=${force}`) : Promise.resolve(false),
    [post, caseId]
  );
  const review = useCallback((artifactId: string, statusValue: ArtifactStatus,
                              editedPayload?: Record<string, unknown>) =>
    post(`/artifacts/${artifactId}/review`, { status: statusValue, edited_payload: editedPayload }),
    [post]);

  const edit = useCallback(async (artifactId: string, finalPayload: Record<string, unknown>) => {
    const headers = { ...(await getAuthHeaders()), "Content-Type": "application/json" };
    const res = await fetch(`${API_URL}/artifacts/${artifactId}`, {
      method: "PATCH", headers, body: JSON.stringify({ final_payload: finalPayload }),
    });
    await refresh();
    return res.ok;
  }, [refresh]);

  return { artifacts, isLoading, refresh, generate, regenerate, review, edit };
}
