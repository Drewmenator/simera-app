"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { AuditResult } from "@/lib/api";
import { getLatestAudit } from "@/lib/api";

interface AuditContextValue {
  result: AuditResult | null;
  setResult: (result: AuditResult) => void;
  clearResult: () => void;
  isLoading: boolean;
}

const AuditContext = createContext<AuditContextValue>({
  result: null,
  setResult: () => {},
  clearResult: () => {},
  isLoading: false,
});

const PENDING_KEY = "simera_pending_audit_result";

/** Call from onboarding after upload completes — dashboard picks it up instantly. */
export function stashAuditResult(result: AuditResult) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(result));
  } catch { /* quota or SSR — silent */ }
}

export function AuditProvider({ children }: { children: ReactNode }) {
  // Seed from stash (onboarding handoff) for zero-latency first render
  const [result, setResultState] = useState<AuditResult | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        sessionStorage.removeItem(PENDING_KEY);
        return JSON.parse(raw) as AuditResult;
      }
    } catch { /* corrupt data — ignore */ }
    return null;
  });
  // If we pre-seeded from the stash, no need for a loading state
  const hadStash = useRef(result !== null);
  const [isLoading, setIsLoading] = useState(!hadStash.current);

  useEffect(() => {
    // If we already have a stashed result, skip the fetch (it's fresh)
    if (hadStash.current) { setIsLoading(false); return; }
    let cancelled = false;
    async function restore() {
      try {
        const latest = await getLatestAudit();
        if (!cancelled && latest) setResultState(latest);
      } catch {
        // silent — user can still upload
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    restore();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuditContext.Provider value={{
      result,
      setResult: setResultState,
      clearResult: () => setResultState(null),
      isLoading,
    }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAuditContext() {
  return useContext(AuditContext);
}
