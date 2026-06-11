"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function AthenaCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Authorization denied: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorization code. Please try connecting again.");
      return;
    }

    async function exchange() {
      try {
        // Get auth token from Clerk (window.Clerk)
        const w = window as typeof window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } };
        const token = await w.Clerk?.session?.getToken();

        const res = await fetch(`${BASE}/adapters/athenahealth/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code, state }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
        }

        setStatus("success");
        setMessage("Athenahealth connected successfully! Syncing your 835 data now.");
        setTimeout(() => router.push("/settings?tab=integrations"), 2500);
      } catch (e: unknown) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Connection failed. Please try again.");
      }
    }

    exchange();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f8f8",
      fontFamily: "inherit",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 48px",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        border: "1px solid rgba(11,39,52,0.10)",
        boxShadow: "0 4px 24px -8px rgba(11,39,52,0.15)",
      }}>
        {status === "processing" && (
          <>
            <div style={{ width: 40, height: 40, border: "3px solid #14b8a6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0b2734" }}>Connecting to Athenahealth…</p>
            <p style={{ fontSize: 13, color: "#5c747e", marginTop: 6 }}>Exchanging credentials and syncing your ERA data.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e4f4f1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>✓</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0c8174" }}>Connected!</p>
            <p style={{ fontSize: 13, color: "#5c747e", marginTop: 6 }}>{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f8e8e3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>✗</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#c2553d" }}>Connection failed</p>
            <p style={{ fontSize: 13, color: "#5c747e", marginTop: 6 }}>{message}</p>
            <button
              onClick={() => router.push("/settings?tab=integrations")}
              style={{ marginTop: 20, padding: "8px 24px", borderRadius: 8, border: "none", background: "#0b2734", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Back to Settings
            </button>
          </>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default function AthenaCallback() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <AthenaCallbackInner />
    </Suspense>
  );
}
