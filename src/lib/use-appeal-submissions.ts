"use client";

/**
 * useAppealSubmissions — localStorage-backed appeal submission tracker.
 *
 * Stores every submitted appeal with date, payer, denial code, dollar amount,
 * and outcome (pending / won / lost / escalated). Persists across sessions.
 *
 * localStorage key: "simera:appeals:submissions"
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { recordAppealOutcome } from "@/lib/api";

export type AppealOutcome = "pending" | "won" | "lost" | "escalated";

export interface AppealSubmission {
  id: string;
  submittedAt: string;          // ISO date string
  payer: string;
  denialCode: string;           // primary CARC code, or "" for underpayment/dispute
  dollarAmount: number;
  expectedRecovery: number;
  claimIds: string[];
  cptCodes: string[];
  description: string;
  status: AppealOutcome;
  outcomeDate?: string;         // ISO date when status changed from pending
  outcomeAmount?: number;       // actual amount recovered (for won)
  notes?: string;
}

const LS_KEY = "simera:appeals:submissions";

// In-tab pub/sub so every useAppealSubmissions() instance stays in sync — e.g.
// marking an outcome in the Tracker updates the RecoveryFunnel live, without a
// reload. (The browser 'storage' event only fires cross-tab, not same-tab.)
const subscribers = new Set<() => void>();
function notify(): void {
  subscribers.forEach((fn) => fn());
}

function load(): AppealSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppealSubmission[];
  } catch {
    return [];
  }
}

function save(items: AppealSubmission[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch { /* storage full or SSR */ }
  // Defer so we never trigger another instance's setState mid-update.
  queueMicrotask(notify);
}

export function useAppealSubmissions() {
  const { getToken } = useAuth();
  const [submissions, setSubmissions] = useState<AppealSubmission[]>([]);

  // Hydrate from localStorage on mount + stay in sync with other instances
  useEffect(() => {
    const sync = () => setSubmissions(load());
    sync();
    subscribers.add(sync);
    return () => { subscribers.delete(sync); };
  }, []);

  const addSubmission = useCallback((
    params: Omit<AppealSubmission, "id" | "submittedAt" | "status">
  ): AppealSubmission => {
    const entry: AppealSubmission = {
      ...params,
      id: `appeal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    setSubmissions((prev) => {
      const next = [entry, ...prev];
      save(next);
      return next;
    });
    return entry;
  }, []);

  const updateStatus = useCallback((
    id: string,
    status: AppealOutcome,
    outcomeAmount?: number,
    notes?: string
  ) => {
    setSubmissions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== id) return s;
        // Sync won/lost to backend — best-effort, no await needed
        if (status === "won" || status === "lost") {
          recordAppealOutcome({
            payer_name: s.payer,
            carc_code: s.denialCode || "",
            outcome: status,
            dollar_amount: s.dollarAmount,
            recovered_amount: status === "won" ? (outcomeAmount ?? s.expectedRecovery) : undefined,
            notes: notes,
          }, getToken).catch(() => { /* silent */ });
        }
        return {
          ...s,
          status,
          outcomeDate: new Date().toISOString(),
          ...(outcomeAmount !== undefined ? { outcomeAmount } : {}),
          ...(notes !== undefined ? { notes } : {}),
        };
      });
      save(next);
      return next;
    });
  }, [getToken]);

  const deleteSubmission = useCallback((id: string) => {
    setSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      save(next);
      return next;
    });
  }, []);

  // ── Derived analytics ────────────────────────────────────────────────────
  const resolved = submissions.filter((s) => s.status !== "pending");
  const won = submissions.filter((s) => s.status === "won");
  const pending = submissions.filter((s) => s.status === "pending");
  // In-progress = still in flight with the payer (pending OR escalated).
  const inProgress = submissions.filter((s) => s.status === "pending" || s.status === "escalated");

  const totalSubmitted = submissions.length;
  const totalSubmittedValue = submissions.reduce((s, a) => s + a.dollarAmount, 0);
  const totalInProgressValue = inProgress.reduce((s, a) => s + a.expectedRecovery, 0);
  const totalWon = won.length;
  const totalRecoveredViaAppeals = won.reduce(
    (s, a) => s + (a.outcomeAmount ?? a.expectedRecovery),
    0
  );
  const winRate = resolved.length > 0
    ? Math.round((won.length / resolved.length) * 100)
    : null;

  // Win rate by payer (only payers with ≥1 resolved appeal)
  const byPayer: Record<string, { won: number; total: number; recovered: number }> = {};
  for (const s of submissions) {
    if (!byPayer[s.payer]) byPayer[s.payer] = { won: 0, total: 0, recovered: 0 };
    byPayer[s.payer].total += 1;
    if (s.status === "won") {
      byPayer[s.payer].won += 1;
      byPayer[s.payer].recovered += s.outcomeAmount ?? s.expectedRecovery;
    }
  }

  // Win rate by denial code
  const byCode: Record<string, { won: number; total: number; recovered: number }> = {};
  for (const s of submissions) {
    const code = s.denialCode || "other";
    if (!byCode[code]) byCode[code] = { won: 0, total: 0, recovered: 0 };
    byCode[code].total += 1;
    if (s.status === "won") {
      byCode[code].won += 1;
      byCode[code].recovered += s.outcomeAmount ?? s.expectedRecovery;
    }
  }

  return {
    submissions,
    pending,
    inProgress,
    won,
    totalSubmitted,
    totalSubmittedValue,
    totalInProgressValue,
    totalWon,
    totalRecoveredViaAppeals,
    winRate,
    byPayer,
    byCode,
    addSubmission,
    updateStatus,
    deleteSubmission,
  };
}
