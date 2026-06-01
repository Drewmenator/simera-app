"use client";

import { useState, useCallback, useEffect } from "react";
import { getAuthHeaders } from "@/lib/api";

export type FindingStatus = "open" | "in_progress" | "appealed" | "resolved" | "ignored";

const STORAGE_KEY = "simera_finding_statuses";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function loadLocal(): Record<string, FindingStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocal(data: Record<string, FindingStatus>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useFindingStatuses() {
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>({});

  useEffect(() => {
    // Load localStorage immediately for instant UI
    const local = loadLocal();
    setStatuses(local);

    // Then fetch from API and merge (API takes precedence)
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/findings/statuses`, { headers });
        if (res.ok) {
          const data = await res.json();
          const apiStatuses: Record<string, FindingStatus> = data.statuses ?? {};
          setStatuses((prev) => {
            const merged = { ...prev, ...apiStatuses };
            saveLocal(merged);
            return merged;
          });
        }
      } catch {
        // Network failure — local cache already shown, silently continue
      }
    })();
  }, []);

  const getStatus = useCallback(
    (id: string): FindingStatus => statuses[id] ?? "open",
    [statuses]
  );

  const setStatus = useCallback((id: string, newStatus: FindingStatus) => {
    // Optimistic local update
    setStatuses((prev) => {
      const next = { ...prev, [id]: newStatus };
      saveLocal(next);
      return next;
    });

    // Persist to API in the background
    (async () => {
      try {
        const headers = await getAuthHeaders();
        await fetch(`${API_URL}/findings/status`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ finding_key: id, status: newStatus }),
        });
      } catch {
        // Silently fail — localStorage already updated
      }
    })();
  }, []);

  return { getStatus, setStatus };
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
