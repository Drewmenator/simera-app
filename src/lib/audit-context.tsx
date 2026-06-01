"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

export function AuditProvider({ children }: { children: ReactNode }) {
  const [result, setResultState] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
