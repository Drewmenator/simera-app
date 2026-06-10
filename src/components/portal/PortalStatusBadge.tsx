"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw, Wifi } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface SyncJob {
  id: string;
  job_type: "claim_status" | "fetch_835";
  status: "pending" | "running" | "completed" | "failed";
  claims_checked?: number;
  files_fetched?: number;
  error_message?: string;
  completed_at?: string;
  created_at: string;
}

interface PortalStatusBadgeProps {
  onFetch835?: (jobId: string) => void;
  credentialId?: string;
}

const STATUS_STYLES: Record<SyncJob["status"], { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: "#bd852f", bg: "#fef5e7", icon: Clock },
  running: { color: "#0c8174", bg: "#f0f8f7", icon: Loader2 },
  completed: { color: "#0c8174", bg: "#f0f8f7", icon: CheckCircle2 },
  failed: { color: "#c2553d", bg: "#fdf1ee", icon: AlertCircle },
};

export function PortalStatusBadge({ onFetch835, credentialId }: PortalStatusBadgeProps) {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portal/sync/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: SyncJob[] = await res.json();
        setJobs(data.slice(0, 5));
      }
    } catch { /* silent — portal is optional */ }
  }, [getToken]);

  const checkCredentials = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portal/credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const creds = await res.json();
        setHasCredentials(Array.isArray(creds) && creds.length > 0);
      }
    } catch { setHasCredentials(false); }
  }, [getToken]);

  useEffect(() => {
    checkCredentials();
    fetchJobs();
  }, [checkCredentials, fetchJobs]);

  // Poll while a job is running
  useEffect(() => {
    const running = jobs.some(j => j.status === "pending" || j.status === "running");
    if (!running) return;
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  async function triggerFetch835() {
    if (!credentialId) return;
    setTriggering(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portal/sync/fetch-835`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credential_id: credentialId, max_files: 10 }),
      });
      if (res.ok) {
        const { job_id } = await res.json();
        onFetch835?.(job_id);
        setTimeout(fetchJobs, 800);
      }
    } catch { /* ignore */ } finally {
      setTriggering(false);
    }
  }

  if (hasCredentials === false) return null;

  const latestJob = jobs[0];

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "6px 12px", borderRadius: 10,
      background: "#f4f7f8", border: "1px solid rgba(11,39,52,0.08)",
      fontSize: 12.5,
    }}>
      <Wifi style={{ width: 14, height: 14, color: "#8aa0a8", flexShrink: 0 }} />

      {latestJob ? (
        <>
          <JobStatusPill job={latestJob} />
          <button
            onClick={fetchJobs}
            disabled={loading}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa0a8", padding: 0, display: "flex" }}
            title="Refresh"
          >
            <RefreshCw style={{ width: 13, height: 13 }} />
          </button>
        </>
      ) : (
        <span style={{ color: "#8aa0a8" }}>Portal connected</span>
      )}

      {credentialId && (
        <button
          onClick={triggerFetch835}
          disabled={triggering}
          style={{
            background: "#0c8174", color: "#fff", border: "none", cursor: triggering ? "default" : "pointer",
            borderRadius: 7, padding: "3px 9px", fontSize: 11.5, fontWeight: 600,
            opacity: triggering ? 0.7 : 1, display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {triggering && <Loader2 style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} />}
          Fetch 835s
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function JobStatusPill({ job }: { job: SyncJob }) {
  const cfg = STATUS_STYLES[job.status];
  const Icon = cfg.icon;
  const label = job.job_type === "fetch_835" ? "835 fetch" : "Claim check";
  const detail =
    job.status === "completed"
      ? job.job_type === "fetch_835"
        ? `${job.files_fetched ?? 0} files`
        : `${job.claims_checked ?? 0} claims`
      : job.status === "failed"
      ? "failed"
      : job.status === "running"
      ? "running…"
      : "queued";

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      borderRadius: 7, padding: "2px 8px", fontSize: 12,
    }}>
      <Icon style={{
        width: 12, height: 12, flexShrink: 0,
        animation: job.status === "running" ? "spin 1s linear infinite" : "none",
      }} />
      <span>{label}</span>
      <span style={{ opacity: 0.7 }}>· {detail}</span>
    </div>
  );
}
