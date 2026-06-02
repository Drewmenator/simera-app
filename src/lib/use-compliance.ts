"use client";

import { useState, useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ComplianceKpis {
  tasks_total: number;
  tasks_done: number;
  critical_open: number;
  open_breach_alerts: number;
  baa_count: number;
}

export interface ComplianceTask {
  id: string;
  phase: string; // "0" | "1" | "2" | "3" | "ongoing"
  requirement: string;
  description: string;
  owner: string;
  due_date: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "done" | "blocked" | "waived";
  evidence?: string;
}

export interface BreachAlert {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  event_count: number;
  created_at: string;
}

interface ComplianceState {
  kpis: ComplianceKpis | null;
  tasks: ComplianceTask[];
  breachAlerts: BreachAlert[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCompliance(phase?: string): ComplianceState {
  const [kpis, setKpis] = useState<ComplianceKpis | null>(null);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [breachAlerts, setBreachAlerts] = useState<BreachAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const taskUrl = phase && phase !== "all"
          ? `${BASE}/admin/compliance/tasks?phase=${phase}`
          : `${BASE}/admin/compliance/tasks`;

        const [kpisRes, tasksRes, alertsRes] = await Promise.all([
          fetch(`${BASE}/admin/compliance/kpis`),
          fetch(taskUrl),
          fetch(`${BASE}/admin/compliance/breach-alerts`),
        ]);

        if (!kpisRes.ok || !tasksRes.ok || !alertsRes.ok) {
          throw new Error("Failed to fetch compliance data");
        }

        const [kpisData, tasksData, alertsData] = await Promise.all([
          kpisRes.json(),
          tasksRes.json(),
          alertsRes.json(),
        ]);

        if (!cancelled) {
          setKpis(kpisData);
          setTasks(tasksData);
          setBreachAlerts(alertsData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [phase, tick]);

  return { kpis, tasks, breachAlerts, loading, error, refetch };
}
