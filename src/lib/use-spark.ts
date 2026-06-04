"use client";

/**
 * Spark Agent detection hook.
 *
 * On mount, pings localhost:8000/health to check if a local Spark Agent
 * is running. If found, all API calls route to the local agent instead of
 * the cloud backend — meaning PHI never leaves the practice network.
 *
 * State is cached in sessionStorage so we don't ping on every render.
 */

import { useEffect, useState } from "react";

const SPARK_URL = "http://localhost:8000";
const CACHE_KEY = "simera_spark_detected";
const CACHE_TTL_MS = 60_000; // re-check every 60 seconds

export interface SparkStatus {
  detected: boolean;
  checking: boolean;
  url: string | null;
  lastChecked: number | null;
}

export function useSparkAgent(): SparkStatus {
  const [status, setStatus] = useState<SparkStatus>({
    detected: false,
    checking: true,
    url: null,
    lastChecked: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      // Check session cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL_MS) {
            if (!cancelled) setStatus({ detected: parsed.detected, checking: false, url: parsed.detected ? SPARK_URL : null, lastChecked: parsed.ts });
            return;
          }
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch(`${SPARK_URL}/health`, {
          signal: AbortSignal.timeout(1500),
          cache: "no-store",
        });
        const data = await res.json();
        const detected = res.ok && data?.mode === "spark";
        const ts = Date.now();
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ detected, ts }));
        if (!cancelled) setStatus({ detected, checking: false, url: detected ? SPARK_URL : null, lastChecked: ts });
      } catch {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ detected: false, ts: Date.now() }));
        if (!cancelled) setStatus({ detected: false, checking: false, url: null, lastChecked: Date.now() });
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  return status;
}
