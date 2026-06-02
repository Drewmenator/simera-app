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

// ─── Mock data (demo fallback when API is unavailable) ───────────────────────

const MOCK_TASKS: ComplianceTask[] = [
  { id: "c1", phase: "0", requirement: "Execute BAAs with cloud vendors", description: "Sign Business Associate Agreements with AWS, Vercel, and Supabase. Include AI model training prohibition clause.", owner: "Legal / CTO", due_date: "Jun 30, 2026", severity: "critical", status: "in_progress" },
  { id: "c2", phase: "0", requirement: "TLS 1.2+ & AES-256 encryption", description: "Enforce TLS 1.2 minimum in transit across all endpoints. AES-256 at rest for all PHI-containing database tables.", owner: "Engineering", due_date: "Jun 15, 2026", severity: "critical", status: "done" },
  { id: "c3", phase: "0", requirement: "MFA for all system access", description: "Mandatory MFA under 2025 HIPAA Security Rule update. Enforce via Clerk for all staff and customer accounts.", owner: "Engineering", due_date: "Jun 15, 2026", severity: "critical", status: "done" },
  { id: "c4", phase: "0", requirement: "Inference-level AI audit logs", description: "Log every AI suggestion: prompt, response, confidence tier, and accept/modify/ignore decision. Required for FCA compliance.", owner: "Engineering", due_date: "Jul 1, 2026", severity: "critical", status: "in_progress" },
  { id: "c5", phase: "0", requirement: "Role-based access controls (RBAC)", description: "Enforce minimum necessary standard per 45 CFR § 164.502(b). Practice admin vs. billing vs. read-only roles.", owner: "Engineering", due_date: "Jul 15, 2026", severity: "high", status: "pending" },
  { id: "c6", phase: "0", requirement: "Designate Privacy & Security Officers", description: "Appoint named Privacy Officer and Security Officer. Document responsibilities and contact information.", owner: "Operations", due_date: "Jun 30, 2026", severity: "high", status: "pending" },
  { id: "c7", phase: "0", requirement: "HIPAA Security Risk Assessment", description: "Conduct and document a full HIPAA Security Risk Assessment. Required before any PHI is processed in production.", owner: "Security", due_date: "Jul 31, 2026", severity: "critical", status: "pending" },
  { id: "c8", phase: "0", requirement: "Human review hard-stop for AI claims", description: "AI-generated claim suggestions must require explicit human sign-off before submission to payer. No automated submission.", owner: "Product / Engineering", due_date: "Jun 30, 2026", severity: "critical", status: "done" },
  { id: "c9", phase: "1", requirement: "SOC 2 Type II audit readiness", description: "Engage qualified SOC 2 auditor. Begin evidence collection for security, availability, and confidentiality trust service criteria.", owner: "Security / Legal", due_date: "Dec 31, 2026", severity: "high", status: "pending" },
  { id: "c10", phase: "1", requirement: "Annual penetration testing", description: "Annual pentest + semi-annual vulnerability scans required under 2025 HIPAA Security Rule. Engage qualified vendor.", owner: "Security", due_date: "Oct 1, 2026", severity: "high", status: "pending" },
  { id: "c11", phase: "1", requirement: "AI-specific audit reporting", description: "Per-claim accept/reject rates, coder override tracking, denial pattern anomaly detection. OIG compliance requirement.", owner: "Engineering", due_date: "Sep 30, 2026", severity: "medium", status: "pending" },
  { id: "c12", phase: "1", requirement: "HITRUST self-assessment", description: "Required by athenahealth Marketplace within 90 days of going GA. Begin self-assessment preparation.", owner: "Security", due_date: "Jan 15, 2027", severity: "high", status: "pending" },
  { id: "c13", phase: "2", requirement: "SOC 2 Type II certification", description: "Complete 6-month observation period and obtain SOC 2 Type II report. Required for enterprise customers.", owner: "Security", due_date: "Jun 30, 2027", severity: "high", status: "pending" },
  { id: "c14", phase: "2", requirement: "Third-party AI bias audit", description: "Commission disparate impact analysis across protected class proxies per CMS-4201-F requirement.", owner: "AI / Legal", due_date: "Dec 31, 2027", severity: "medium", status: "pending" },
  { id: "c15", phase: "2", requirement: "FHIR Prior Auth API integrations", description: "Payers required to expose FHIR PA APIs by Jan 1, 2027 under CMS-0057-F. Integrate to automate prior auth workflows.", owner: "Engineering", due_date: "Mar 31, 2027", severity: "medium", status: "pending" },
  { id: "c16", phase: "ongoing", requirement: "6-year PHI & audit log retention", description: "Maintain all PHI-related records and audit logs for minimum 6 years from creation or last use.", owner: "Engineering / Legal", due_date: "Ongoing", severity: "high", status: "in_progress" },
  { id: "c17", phase: "ongoing", requirement: "BAA tracking register", description: "Maintain register of all executed BAAs. Review annually for coverage gaps and expired agreements.", owner: "Legal", due_date: "Ongoing", severity: "medium", status: "in_progress" },
];

const MOCK_KPIS: ComplianceKpis = {
  tasks_total: MOCK_TASKS.length,
  tasks_done: MOCK_TASKS.filter((t) => t.status === "done").length,
  critical_open: MOCK_TASKS.filter((t) => t.severity === "critical" && t.status !== "done" && t.status !== "waived").length,
  open_breach_alerts: 1,
  baa_count: 3,
};

const MOCK_BREACH_ALERTS: BreachAlert[] = [
  { id: "b1", type: "Unusual bulk export — 847 records accessed in 4 min", severity: "high", event_count: 3, created_at: "2026-05-28T14:22:00Z" },
];

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
      } catch {
        // API unavailable — fall back to mock data for demo
        if (!cancelled) {
          const filtered = phase && phase !== "all"
            ? MOCK_TASKS.filter((t) => t.phase === phase)
            : MOCK_TASKS;
          setKpis(MOCK_KPIS);
          setTasks(filtered);
          setBreachAlerts(MOCK_BREACH_ALERTS);
          setError(null);
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
