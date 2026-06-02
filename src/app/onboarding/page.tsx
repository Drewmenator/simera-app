"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Shield,
  CheckCircle2,
  ChevronRight,
  Upload,
  ArrowRight,
  Loader2,
  Building2,
  Stethoscope,
  Link as LinkIcon,
  SkipForward,
} from "lucide-react";
import { acceptBaa, setupPractice, uploadAuditAsync, pollAuditJob, type AuditResult } from "@/lib/api";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  navy: "#0b2734",
  teal: "#0c8174",
  tealBright: "#14b8a6",
  bg: "#f4f7f8",
  white: "#ffffff",
  border: "#e2e8f0",
  muted: "#64748b",
  text: "#1e293b",
  subtle: "#374151",
  errorBg: "#fef2f2",
  errorText: "#b91c1c",
};

const SPECIALTIES = [
  { value: "primary_care", label: "Primary Care" },
  { value: "family_medicine", label: "Family Medicine" },
  { value: "internal_medicine", label: "Internal Medicine" },
  { value: "cardiology", label: "Cardiology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "dermatology", label: "Dermatology" },
  { value: "urgent_care", label: "Urgent Care" },
  { value: "general", label: "Other / General" },
];

const PROVIDER_COUNTS = [
  { value: "1-5", label: "1 – 5 providers" },
  { value: "6-10", label: "6 – 10 providers" },
  { value: "11-25", label: "11 – 25 providers" },
  { value: "25+", label: "25+ providers" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const EHR_OPTIONS = [
  { id: "athenahealth", label: "athenahealth", color: "#0096D6" },
  { id: "epic", label: "Epic", color: "#C8202F" },
  { id: "eclinicalworks", label: "eClinicalWorks", color: "#0066CC" },
  { id: "nextgen", label: "NextGen", color: "#006B3C" },
  { id: "manual", label: "Other / Manual", color: C.navy },
];

// ── Logo mark (matches sidebar) ───────────────────────────────────────────────
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: size,
          height: size,
          background: C.tealBright,
          borderRadius: Math.round(size * 0.25),
          position: "relative",
          flexShrink: 0,
          boxShadow: `0 4px 12px -2px rgba(20,184,166,0.4)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: `${Math.round(size * 0.3)}px ${Math.round(size * 0.3)}px auto auto`,
            width: Math.round(size * 0.35),
            height: Math.round(size * 0.35),
            borderRadius: Math.round(size * 0.1),
            background: C.navy,
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#eaf2f3",
          }}
        >
          simera
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.18em",
            color: C.tealBright,
            textTransform: "uppercase",
            marginTop: 1,
          }}
        >
          health
        </div>
      </div>
    </div>
  );
}

// ── Step progress indicator ───────────────────────────────────────────────────
const STEP_LABELS = ["Agreement", "Practice", "EHR", "First Upload"];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? 1 : "none" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: done ? C.tealBright : active ? C.navy : "#e2e8f0",
                  border: active ? `2px solid ${C.tealBright}` : "2px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                {done ? (
                  <CheckCircle2 size={14} color="#fff" />
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: active ? C.tealBright : C.muted,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.navy : done ? C.teal : C.muted,
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                {label.toUpperCase()}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? C.tealBright : "#e2e8f0",
                  margin: "0 6px",
                  marginBottom: 20,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: C.navy,
        marginBottom: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}

function inputStyle(focused?: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1.5px solid ${focused ? C.tealBright : C.border}`,
    fontSize: 14,
    color: C.text,
    background: C.white,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };
}

// ── Step 1: BAA ───────────────────────────────────────────────────────────────
const BAA_POINTS = [
  "Simera uses PHI only to provide the revenue intelligence service",
  "All data encrypted in transit (TLS 1.2+) and at rest (AES-256)",
  "Breach notification within 60 days per 45 CFR Parts 160 and 164",
];

function Step1Baa({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const handleAccept = async () => {
    if (!checked) return;
    setSaving(true);
    setError(null);
    try {
      await acceptBaa({
        userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
        userName: user?.fullName ?? undefined,
      });
      // Persist locally so the rest of the app doesn't re-prompt
      localStorage.setItem("simera_baa_accepted", new Date().toISOString());
      onContinue();
    } catch {
      setError("Failed to record your acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(20,184,166,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Shield size={22} color={C.tealBright} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: "-0.02em" }}>
            Business Associate Agreement
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.04em" }}>
            HIPAA REQUIRED — BEFORE UPLOAD
          </p>
        </div>
      </div>

      <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.65, color: C.subtle }}>
        835 ERA files may contain Protected Health Information (PHI). Before uploading,
        your organization must execute a Business Associate Agreement (BAA) with Simera Health
        as required by HIPAA.
      </p>

      <div
        style={{
          background: "#f8fafc",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "16px 18px",
          marginBottom: 20,
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>
          Agreement Summary
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {BAA_POINTS.map((point) => (
            <li key={point} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={16} color={C.tealBright} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: C.subtle, lineHeight: 1.5 }}>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          cursor: "pointer",
          marginBottom: 24,
          padding: "12px 14px",
          border: `1.5px solid ${checked ? C.tealBright : C.border}`,
          borderRadius: 8,
          background: checked ? "rgba(20,184,166,0.04)" : C.white,
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 2, width: 16, height: 16, accentColor: C.tealBright, flexShrink: 0, cursor: "pointer" }}
        />
        <span style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>
          I have authority to execute this agreement on behalf of my organization and accept the BAA
        </span>
      </label>

      {error && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: C.errorText, background: C.errorBg, padding: "8px 12px", borderRadius: 6 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={!checked || saving}
        style={{
          width: "100%",
          padding: "13px 20px",
          borderRadius: 10,
          border: "none",
          background: checked && !saving ? C.tealBright : "#e2e8f0",
          color: checked && !saving ? C.white : C.muted,
          fontSize: 15,
          fontWeight: 700,
          cursor: checked && !saving ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
        {saving ? "Saving…" : "Accept & Continue"}
        {!saving && <ChevronRight size={16} />}
      </button>

      <p style={{ margin: "12px 0 0", fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'IBM Plex Mono', monospace" }}>
        Questions?{" "}
        <a href="mailto:compliance@simera.health" style={{ color: C.tealBright, textDecoration: "none" }}>
          compliance@simera.health
        </a>
      </p>
    </div>
  );
}

// ── Step 2: Practice Setup ────────────────────────────────────────────────────
function Step2Practice({
  onContinue,
}: {
  onContinue: (practiceId: string, practiceName: string) => void;
}) {
  const [form, setForm] = useState({
    practice_name: "",
    specialty: "",
    state: "",
    provider_count: "",
    billing_npi: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const valid =
    form.practice_name.trim().length > 0 &&
    form.specialty.length > 0 &&
    form.state.length > 0 &&
    form.provider_count.length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const result = await setupPractice(form);
      onContinue(result.practice_id, result.practice_name);
    } catch (err: any) {
      setError(err.message ?? "Failed to save practice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(12,129,116,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={22} color={C.teal} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: "-0.02em" }}>
            Tell us about your practice
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            This personalizes your revenue analysis
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <Label>Practice Name *</Label>
          <input
            style={inputStyle()}
            placeholder="e.g. Riverside Family Medicine"
            value={form.practice_name}
            onChange={(e) => set("practice_name", e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Specialty *</Label>
            <select
              style={{ ...inputStyle(), appearance: "none", cursor: "pointer" }}
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
            >
              <option value="">Select…</option>
              {SPECIALTIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>State *</Label>
            <select
              style={{ ...inputStyle(), appearance: "none", cursor: "pointer" }}
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Number of Providers *</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PROVIDER_COUNTS.map((pc) => (
              <button
                key={pc.value}
                onClick={() => set("provider_count", pc.value)}
                style={{
                  padding: "9px 8px",
                  borderRadius: 8,
                  border: `1.5px solid ${form.provider_count === pc.value ? C.tealBright : C.border}`,
                  background: form.provider_count === pc.value ? "rgba(20,184,166,0.06)" : C.white,
                  color: form.provider_count === pc.value ? C.navy : C.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                {pc.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Billing NPI <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: C.muted }}>(optional)</span></Label>
          <input
            style={inputStyle()}
            placeholder="10-digit NPI"
            value={form.billing_npi}
            onChange={(e) => set("billing_npi", e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
          />
        </div>
      </div>

      {error && (
        <p style={{ margin: "16px 0 0", fontSize: 12, color: C.errorText, background: C.errorBg, padding: "8px 12px", borderRadius: 6 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!valid || saving}
        style={{
          width: "100%",
          marginTop: 24,
          padding: "13px 20px",
          borderRadius: 10,
          border: "none",
          background: valid && !saving ? C.tealBright : "#e2e8f0",
          color: valid && !saving ? C.white : C.muted,
          fontSize: 15,
          fontWeight: 700,
          cursor: valid && !saving ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {saving && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
        {saving ? "Saving…" : "Continue"}
        {!saving && <ChevronRight size={16} />}
      </button>
    </div>
  );
}

// ── Step 3: EHR Connection ────────────────────────────────────────────────────
function Step3Ehr({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (selected === "manual") {
      onContinue();
      return;
    }
    if (selected === "athenahealth") {
      setConnecting(true);
      try {
        const { auth_url } = await import("@/lib/api").then((m) =>
          m.getAthenaConnectUrl()
        );
        // In a full implementation, redirect to auth_url for OAuth
        // For now, show that it's coming soon and proceed
        window.open(auth_url, "_blank", "noopener,noreferrer");
        setTimeout(() => { setConnecting(false); onContinue(); }, 1500);
      } catch {
        setConnecting(false);
        onContinue();
      }
      return;
    }
    // Other EHRs — coming soon, just proceed
    onContinue();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(11,39,52,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <LinkIcon size={22} color={C.navy} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: "-0.02em" }}>
            Connect your EHR
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            Or upload 835 files manually — your choice
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {EHR_OPTIONS.map((ehr) => (
          <button
            key={ehr.id}
            onClick={() => setSelected(ehr.id)}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: `2px solid ${selected === ehr.id ? ehr.color : C.border}`,
              background: selected === ehr.id ? `${ehr.color}0d` : C.white,
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: selected === ehr.id ? ehr.color : C.border,
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: selected === ehr.id ? C.navy : C.muted }}>
              {ehr.label}
            </span>
          </button>
        ))}
      </div>

      {selected === "manual" && (
        <div
          style={{
            background: "#f0fdf8",
            border: `1px solid ${C.tealBright}`,
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: C.subtle,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: C.navy }}>Manual upload mode:</strong> You&apos;ll upload 835 ERA files
          directly in the next step. Export them from your practice management system as .835, .edi, or .txt files.
        </div>
      )}

      {selected === "athenahealth" && (
        <div
          style={{
            background: "#eff8ff",
            border: "1px solid #bae6fd",
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: C.subtle,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: C.navy }}>OAuth integration:</strong> We&apos;ll open athenahealth&apos;s
          authorization page. After you grant access, 835 files will sync automatically.
          <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "#0369a1" }}>
            Note: Full athenahealth OAuth is coming soon — you&apos;ll be redirected to a stub page for now.
          </span>
        </div>
      )}

      {selected && selected !== "manual" && selected !== "athenahealth" && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          <strong>{EHR_OPTIONS.find((e) => e.id === selected)?.label} integration</strong> is coming soon.
          You can upload 835 files manually in the next step.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleConnect}
          disabled={!selected || connecting}
          style={{
            padding: "13px 20px",
            borderRadius: 10,
            border: "none",
            background: selected && !connecting ? C.tealBright : "#e2e8f0",
            color: selected && !connecting ? C.white : C.muted,
            fontSize: 15,
            fontWeight: 700,
            cursor: selected && !connecting ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          {connecting && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
          {connecting ? "Connecting…" : selected === "athenahealth" ? "Connect athenahealth" : selected === "manual" ? "Continue to Upload" : selected ? "Continue" : "Select an EHR above"}
          {!connecting && selected && <ChevronRight size={16} />}
        </button>

        <button
          onClick={onSkip}
          style={{
            padding: "11px 20px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "none",
            color: C.muted,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
          }}
        >
          <SkipForward size={14} />
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ── Step 4: First Upload ──────────────────────────────────────────────────────
function Step4Upload({
  practiceName,
  onComplete,
  onDashboard,
}: {
  practiceName: string;
  onComplete: (result: AuditResult) => void;
  onDashboard: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".835") || f.name.endsWith(".edi") || f.name.endsWith(".txt")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setStep("uploading");
    setErrorMsg("");
    try {
      const jobId = await uploadAuditAsync(files, practiceName || "Your Practice");
      setStep("processing");
      const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
      const pollStart = Date.now();

      const poll = setInterval(async () => {
        if (Date.now() - pollStart > POLL_TIMEOUT_MS) {
          clearInterval(poll);
          setStep("error");
          setErrorMsg("Processing is taking longer than expected. Please try again or contact support.");
          return;
        }
        try {
          const job = await pollAuditJob(jobId);
          if (job.status === "complete" && job.result) {
            clearInterval(poll);
            setStep("done");
            setTimeout(() => onComplete(job.result!), 1200);
          } else if (job.status === "error") {
            clearInterval(poll);
            setStep("error");
            setErrorMsg(job.message ?? "Audit processing failed.");
          }
        } catch (err: any) {
          clearInterval(poll);
          setStep("error");
          setErrorMsg(err.message ?? "Polling failed.");
        }
      }, 2000);
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message ?? "Upload failed.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(20,184,166,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Stethoscope size={22} color={C.tealBright} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.navy, letterSpacing: "-0.02em" }}>
            Upload your first 835 file
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
            See your revenue leakage in under 60 seconds
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? C.tealBright : files.length ? C.teal : C.border}`,
          borderRadius: 12,
          padding: "32px 20px",
          textAlign: "center",
          background: isDragging ? "rgba(20,184,166,0.04)" : "#fafafa",
          transition: "border-color 0.15s, background 0.15s",
          cursor: "pointer",
          marginBottom: 16,
        }}
        onClick={() => document.getElementById("onboarding-file-input")?.click()}
      >
        <Upload size={28} color={isDragging ? C.tealBright : C.muted} style={{ marginBottom: 10 }} />
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: C.navy }}>
          {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Drop your 835 files here"}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
          .835 · .edi · .txt — or click to browse
        </p>
        <input
          id="onboarding-file-input"
          type="file"
          accept=".835,.edi,.txt"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
      </div>

      {files.length > 0 && (
        <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#f0fdf8",
                borderRadius: 8,
                fontSize: 13,
                color: C.navy,
              }}
            >
              <span>{f.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, idx) => idx !== i)); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, lineHeight: 1, padding: 0 }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === "error" && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: C.errorText, background: C.errorBg, padding: "8px 12px", borderRadius: 6 }}>
          {errorMsg}
        </p>
      )}

      {(step === "uploading" || step === "processing") && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f0fdf8", borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.teal }}>
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          {step === "uploading" ? "Uploading files…" : "Analyzing your 835 data — usually under 30 seconds…"}
        </div>
      )}

      {step === "done" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#f0fdf8", borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.teal, fontWeight: 600 }}>
          <CheckCircle2 size={16} color={C.tealBright} />
          Analysis complete — loading your dashboard…
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={handleUpload}
          disabled={!files.length || step === "uploading" || step === "processing" || step === "done"}
          style={{
            padding: "13px 20px",
            borderRadius: 10,
            border: "none",
            background: files.length && step === "idle" ? C.tealBright : "#e2e8f0",
            color: files.length && step === "idle" ? C.white : C.muted,
            fontSize: 15,
            fontWeight: 700,
            cursor: files.length && step === "idle" ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          <Upload size={16} />
          Analyze my 835 files
        </button>

        <button
          onClick={onDashboard}
          style={{
            padding: "11px 20px",
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "none",
            color: C.muted,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "inherit",
          }}
        >
          <ArrowRight size={14} />
          Go to dashboard first
        </button>
      </div>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [practiceId, setPracticeId] = useState("");
  const [practiceName, setPracticeName] = useState("Your Practice");

  const handleBaaDone = () => setStep(1);

  const handlePracticeDone = (id: string, name: string) => {
    setPracticeId(id);
    setPracticeName(name);
    setStep(2);
  };

  const handleEhrDone = () => setStep(3);
  const handleEhrSkip = () => setStep(3);

  const handleUploadComplete = (result: AuditResult) => {
    // Store the result and navigate to dashboard
    sessionStorage.setItem("simera_onboarded", "1");
    router.push("/");
  };

  const handleDashboard = () => {
    sessionStorage.setItem("simera_onboarded", "1");
    router.push("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <LogoMark size={36} />
          <h1
            style={{
              margin: "16px 0 6px",
              fontSize: 26,
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "-0.03em",
            }}
          >
            Welcome to Simera
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
            We recover denied revenue for your practice. Let&apos;s get you set up.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            boxShadow: "0 8px 32px -4px rgba(11,39,52,0.12)",
            padding: "32px 32px 28px",
          }}
        >
          <StepBar current={step} />

          {step === 0 && <Step1Baa onContinue={handleBaaDone} />}
          {step === 1 && <Step2Practice onContinue={handlePracticeDone} />}
          {step === 2 && <Step3Ehr onContinue={handleEhrDone} onSkip={handleEhrSkip} />}
          {step === 3 && (
            <Step4Upload
              practiceName={practiceName}
              onComplete={handleUploadComplete}
              onDashboard={handleDashboard}
            />
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 11,
            color: "#94a3b8",
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >
          HIPAA-COMPLIANT · AES-256 ENCRYPTED · SOC 2 IN PROGRESS
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
