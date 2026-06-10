"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PORTAL_OPTIONS = [
  { value: "availity", label: "Availity", description: "Multi-payer portal — claim status, ERAs" },
  { value: "office_ally", label: "Office Ally", description: "Clearinghouse — 835 ERA downloads" },
  { value: "navinet", label: "NaviNet", description: "Highmark, BCBS — eligibility + claims" },
  { value: "change_healthcare", label: "Change Healthcare", description: "EDI clearinghouse" },
] as const;

type PortalType = (typeof PORTAL_OPTIONS)[number]["value"];

interface ConnectPortalModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type Step = "choose" | "credentials" | "saving" | "done" | "error";

export function ConnectPortalModal({ open, onClose, onSaved }: ConnectPortalModalProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [portalType, setPortalType] = useState<PortalType>("availity");
  const [label, setLabel] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function resetAndClose() {
    setStep("choose");
    setUsername("");
    setPassword("");
    setLabel("");
    setError("");
    onClose();
  }

  async function handleSave() {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setStep("saving");
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/portal/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          portal_type: portalType,
          portal_label: label || PORTAL_OPTIONS.find(p => p.value === portalType)!.label,
          username: username.trim(),
          password: password,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      setStep("done");
      setTimeout(() => {
        onSaved();
        resetAndClose();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save credentials");
      setStep("credentials");
    }
  }

  if (!open) return null;

  const selectedPortal = PORTAL_OPTIONS.find(p => p.value === portalType)!;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(11,39,52,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) resetAndClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 18, width: 480, maxWidth: "94vw",
        boxShadow: "0 24px 64px rgba(11,39,52,0.22), 0 2px 8px rgba(11,39,52,0.08)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8", marginBottom: 4 }}>
              Sprint 2 · Portal Navigator
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0b2734", margin: 0 }}>
              Connect Payer Portal
            </h2>
          </div>
          <button onClick={resetAndClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa0a8", padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {/* Step: choose portal */}
          {(step === "choose" || step === "credentials") && (
            <>
              {step === "choose" && (
                <>
                  <p style={{ fontSize: 13.5, color: "#5c747e", marginBottom: 16, lineHeight: 1.5 }}>
                    Simera will use a secure headless browser to log in on your behalf and check claim status + download 835 ERA files automatically.
                  </p>
                  <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                    {PORTAL_OPTIONS.map(portal => (
                      <button
                        key={portal.value}
                        onClick={() => { setPortalType(portal.value); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                          border: `2px solid ${portalType === portal.value ? "#0c8174" : "rgba(11,39,52,0.10)"}`,
                          background: portalType === portal.value ? "#f0f8f7" : "#fff",
                          textAlign: "left", transition: "border-color 0.15s",
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: portalType === portal.value ? "#0c8174" : "#e9eded",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: portalType === portal.value ? "#fff" : "#5c747e" }}>
                            {portal.label[0]}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#0b2734" }}>{portal.label}</div>
                          <div style={{ fontSize: 12, color: "#8aa0a8", marginTop: 2 }}>{portal.description}</div>
                        </div>
                        {portalType === portal.value && (
                          <CheckCircle2 style={{ width: 18, height: 18, color: "#0c8174", marginLeft: "auto", flexShrink: 0 }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    style={{ width: "100%", background: "#0c8174", color: "#fff", height: 42, fontSize: 14, fontWeight: 600, borderRadius: 10 }}
                    onClick={() => setStep("credentials")}
                  >
                    Continue with {selectedPortal.label}
                  </Button>
                </>
              )}

              {/* Step: enter credentials */}
              {step === "credentials" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <button
                      onClick={() => setStep("choose")}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa0a8", fontSize: 13 }}
                    >
                      ← Back
                    </button>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#0b2734" }}>
                      {selectedPortal.label} credentials
                    </span>
                  </div>

                  <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#5c747e", lineHeight: 1.5 }}>
                    Your credentials are encrypted with AES-256 (Fernet) before storage and are never logged. Simera uses them only to automate this portal session.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5c747e", display: "block", marginBottom: 6 }}>
                        Label (optional)
                      </label>
                      <input
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder={`My ${selectedPortal.label} account`}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid rgba(11,39,52,0.15)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5c747e", display: "block", marginBottom: 6 }}>
                        Username / Email *
                      </label>
                      <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="portal@yourpractice.com"
                        autoComplete="username"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid rgba(11,39,52,0.15)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#5c747e", display: "block", marginBottom: 6 }}>
                        Password *
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••••"
                          autoComplete="current-password"
                          style={{ width: "100%", padding: "9px 40px 9px 12px", borderRadius: 9, border: "1.5px solid rgba(11,39,52,0.15)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8aa0a8" }}
                        >
                          {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "10px 14px", background: "#fdf1ee", borderRadius: 9, color: "#c2553d", fontSize: 13 }}>
                      <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    style={{ width: "100%", background: "#0c8174", color: "#fff", height: 42, fontSize: 14, fontWeight: 600, borderRadius: 10, marginTop: 18 }}
                  >
                    Save credentials
                  </Button>
                </>
              )}
            </>
          )}

          {/* Saving */}
          {step === "saving" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Loader2 style={{ width: 32, height: 32, color: "#0c8174", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
              <p style={{ color: "#5c747e", fontSize: 14 }}>Encrypting and saving credentials…</p>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <CheckCircle2 style={{ width: 36, height: 36, color: "#0c8174", margin: "0 auto 14px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, color: "#0b2734", marginBottom: 6 }}>Connected!</p>
              <p style={{ color: "#5c747e", fontSize: 13.5 }}>Portal credentials saved. Simera can now check claim status and fetch ERAs automatically.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
