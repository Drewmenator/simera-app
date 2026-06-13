"use client";

/**
 * useOverdueAppeals
 *
 * Detects pending appeal submissions older than 30 days and returns a count.
 * Surfaces inside the Appeals tab so billing staff see a clear action item
 * when they have stale submissions that need a follow-up call.
 */

import { useMemo } from "react";
import { useAppealSubmissions } from "@/lib/use-appeal-submissions";

const OVERDUE_DAYS = 30;

export function useOverdueAppeals() {
  const { submissions } = useAppealSubmissions();

  const overdue = useMemo(() => {
    const cutoff = Date.now() - OVERDUE_DAYS * 24 * 60 * 60 * 1000;
    return submissions.filter(
      (s) => s.status === "pending" && new Date(s.submittedAt).getTime() < cutoff
    );
  }, [submissions]);

  return {
    overdueCount: overdue.length,
    overdueAppeals: overdue,
    hasOverdue: overdue.length > 0,
  };
}
