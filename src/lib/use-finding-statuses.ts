"use client";

import { useState, useCallback, useEffect } from "react";
import { getAuthHeaders } from "@/lib/api";

export type FindingStatus = "open" | "in_progress" | "appealed" | "resolved" | "ignored";

const STATUS_KEY = "simera_finding_statuses_v2";
const RECOVERY_KEY = "simera_finding_recoveries";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function useFindingStatuses() {
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>({});
  const [recoveries, setRecoveries] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load localStorage immediately for instant UI
    setStatuses(loadLocal<Record<string, FindingStatus>>(STATUS_KEY, {}));
    setRecoveries(loadLocal<Record<string, number>>(RECOVERY_KEY, {}));

    // Then fetch from API (API takes precedence)
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/findings/statuses`, { headers });
        if (res.ok) {
          const data = await res.json();
          // API returns {finding_key: {status, recovered_amount}} or legacy {finding_key: status}
          const apiData: Record<string, { status: FindingStatus; recovered_amount: number | null } | FindingStatus> = data.statuses ?? {};

          const apiStatuses: Record<string, FindingStatus> = {};
          const apiRecoveries: Record<string, number> = {};

          for (const [key, val] of Object.entries(apiData)) {
            if (typeof val === "string") {
              apiStatuses[key] = val as FindingStatus;
            } else {
              apiStatuses[key] = val.status;
              if (val.recovered_amount != null) {
                apiRecoveries[key] = val.recovered_amount;
              }
            }
          }

          setStatuses((prev) => {
            const merged = { ...prev, ...apiStatuses };
            saveLocal(STATUS_KEY, merged);
            return merged;
          });
          setRecoveries((prev) => {
            const merged = { ...prev, ...apiRecoveries };
            saveLocal(RECOVERY_KEY, merged);
            return merged;
          });
        }
      } catch {
        // Network failure — local cache already shown
      }
    })();
  }, []);

  const getStatus = useCallback(
    (id: string): FindingStatus => statuses[id] ?? "open",
    [statuses]
  );

  const getRecoveredAmount = useCallback(
    (id: string): number => recoveries[id] ?? 0,
    [recoveries]
  );

  const setStatus = useCallback(
    (id: string, newStatus: FindingStatus, recoveredAmount?: number) => {
      // Optimistic local update
      setStatuses((prev) => {
        const next = { ...prev, [id]: newStatus };
        saveLocal(STATUS_KEY, next);
        return next;
      });

      if (recoveredAmount !== undefined) {
        setRecoveries((prev) => {
          const next = { ...prev, [id]: recoveredAmount };
          saveLocal(RECOVERY_KEY, next);
          return next;
        });
      }

      // Persist to API in the background
      (async () => {
        try {
          const headers = await getAuthHeaders();
          await fetch(`${API_URL}/findings/status`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({
              finding_key: id,
              status: newStatus,
              recovered_amount: recoveredAmount ?? null,
            }),
          });
        } catch {
          // Silently fail — localStorage already updated
        }
      })();
    },
    []
  );

  return { getStatus, setStatus, getRecoveredAmount };
}

export function findingId(label: string, payer: string): string {
  return `${label}__${payer}`.toLowerCase().replace(/\s+/g, "_");
}

export const STATUS_CONFIG: Record<FindingStatus, { label: string; bg: string; color: string; border: string }> = {
  open:        { label: "Open",        bg: "#f6f8f8",  color: "#5c747e",  border: "rgba(11,39,52,0.12)" },
  in_progress: { label: "In Progress", bg: "#eaf1fb",  color: "#2563eb",  border: "rgba(37,99,235,0.25)" },
  appealed:    { label: "Appealed",    bg: "#f8efdd",  color: "#9a6a1e",  border: "rgba(189,133,47,0.30)" },
  resolved:    { label: "Resolved",    bg: "#e4f4f1",  color: "#0c8174",  border: "rgba(12,129,116,0.30)" },
  ignored:     { label: "Ignored",     bg: "#f6f6f6",  color: "#9aabb0",  border: "rgba(11,39,52,0.08)" },
};
