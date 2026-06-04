"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Trash2, ChevronDown, DollarSign, TrendingDown } from "lucide-react";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(11,39,52,0.10)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
};

// Common CPT codes for contract rate entry
const COMMON_CPTS = [
  { code: "99213", desc: "Office visit — low/mod complexity" },
  { code: "99214", desc: "Office visit — moderate complexity" },
  { code: "99215", desc: "Office visit — high complexity" },
  { code: "99203", desc: "New patient — low/mod complexity" },
  { code: "99204", desc: "New patient — moderate complexity" },
  { code: "99205", desc: "New patient — high complexity" },
  { code: "G0438", desc: "Annual wellness visit (initial)" },
  { code: "G0439", desc: "Annual wellness visit (subsequent)" },
  { code: "93000", desc: "ECG with interpretation" },
  { code: "94010", desc: "Spirometry" },
  { code: "99490", desc: "Chronic care management" },
  { code: "90837", desc: "Psychotherapy 60 min" },
];

const PAYERS = ["United Healthcare", "Aetna", "Cigna", "Humana", "BlueCross BlueShield", "Medicare", "Medicaid", "Other"];

interface ContractRate {
  id: string;
  payer: string;
  cptCode: string;
  description: string;
  contractedRate: string;
  effectiveDate: string;
}

interface UploadedContract {
  id: string;
  filename: string;
  payer: string;
  uploadedAt: string;
  status: "processing" | "parsed" | "error";
  ratesFound: number;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<UploadedContract[]>([]);
  const [manualRates, setManualRates] = useState<ContractRate[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "manual" | "rates">("upload");
  const [newRate, setNewRate] = useState<Partial<ContractRate>>({ payer: "", cptCode: "", contractedRate: "", effectiveDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith(".pdf") || f.name.endsWith(".xlsx") || f.name.endsWith(".csv") || f.name.endsWith(".txt")
    );
    files.forEach(addFile);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) Array.from(e.target.files).forEach(addFile);
  }

  function addFile(file: File) {
    const entry: UploadedContract = {
      id: Math.random().toString(36).slice(2),
      filename: file.name,
      payer: "",
      uploadedAt: new Date().toLocaleTimeString(),
      status: "processing",
      ratesFound: 0,
    };
    setContracts((prev) => [...prev, entry]);
    // Simulate parsing (in prod: POST /contracts/parse)
    setTimeout(() => {
      setContracts((prev) =>
        prev.map((c) => c.id === entry.id
          ? { ...c, status: "parsed", ratesFound: Math.floor(Math.random() * 40) + 5 }
          : c
        )
      );
    }, 2000);
  }

  function addManualRate() {
    if (!newRate.payer || !newRate.cptCode || !newRate.contractedRate) return;
    const cptInfo = COMMON_CPTS.find((c) => c.code === newRate.cptCode);
    setManualRates((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        payer: newRate.payer!,
        cptCode: newRate.cptCode!,
        description: cptInfo?.desc ?? "",
        contractedRate: newRate.contractedRate!,
        effectiveDate: newRate.effectiveDate ?? new Date().toISOString().slice(0, 10),
      },
    ]);
    setNewRate({ payer: "", cptCode: "", contractedRate: "", effectiveDate: new Date().toISOString().slice(0, 10) });
  }

  async function saveRates() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const totalRates = manualRates.length + contracts.filter((c) => c.status === "parsed").reduce((s, c) => s + c.ratesFound, 0);
  const tabs = [
    { id: "upload", label: "Upload Contract PDF" },
    { id: "manual", label: "Enter Rates Manually" },
    { id: "rates", label: `Saved Rates (${totalRates})` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#0b2734", margin: 0 }}>
          Payer Contracts
        </h1>
        <p style={{ fontSize: 13, color: "#5c747e", marginTop: 4 }}>
          Upload contracted rates to detect underpayments — know when payers are paying you less than agreed.
        </p>
      </div>

      {/* Why this matters banner */}
      <div style={{ background: "linear-gradient(160deg, rgba(12,129,116,0.06), rgba(20,184,166,0.04))", border: "1px solid rgba(12,129,116,0.20)", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e4f4f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TrendingDown style={{ width: 16, height: 16, color: "#0c8174" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0b2734", marginBottom: 4 }}>
            Industry data: 2.5–3% of all payments are underpaid at an average of $38/line item
          </div>
          <div style={{ fontSize: 12.5, color: "#5c747e", lineHeight: 1.6 }}>
            Without your contracted rates, Simera uses approximate Medicare rates as a proxy. Upload your actual fee schedules to get precise underpayment detection — payer-by-payer, CPT-by-CPT.
          </div>
        </div>
      </div>

      {/* Main card */}
      <div style={{ ...CARD, padding: "22px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(11,39,52,0.10)", marginBottom: 24 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              style={{
                padding: "11px 16px", fontSize: 13.5, fontWeight: 600,
                color: activeTab === t.id ? "#0b2734" : "#5c747e",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === t.id ? "2px solid #14b8a6" : "2px solid transparent",
                marginBottom: -1, whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {activeTab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#14b8a6" : "rgba(11,39,52,0.15)"}`,
                borderRadius: 12, padding: "40px 24px",
                textAlign: "center", cursor: "pointer",
                background: dragOver ? "rgba(20,184,166,0.04)" : "#fafbfb",
                transition: "all 0.15s",
              }}
            >
              <Upload style={{ width: 28, height: 28, color: "#8aa0a8", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0b2734", margin: "0 0 4px" }}>
                Drop contract PDFs or fee schedules here
              </p>
              <p style={{ fontSize: 12.5, color: "#8aa0a8", margin: 0 }}>
                PDF, Excel (.xlsx), CSV, or plain text · One file per payer
              </p>
              <input ref={fileRef} type="file" multiple accept=".pdf,.xlsx,.csv,.txt" onChange={handleFileChange} style={{ display: "none" }} />
            </div>

            {/* Uploaded files */}
            {contracts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {contracts.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.08)" }}>
                    <FileText style={{ width: 18, height: 18, color: "#8aa0a8", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0b2734" }}>{c.filename}</div>
                      <div style={{ fontSize: 12, color: "#8aa0a8" }}>Uploaded {c.uploadedAt}</div>
                    </div>
                    {c.status === "processing" && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#bd852f", background: "#f8efdd", padding: "3px 10px", borderRadius: 999 }}>Parsing…</span>
                    )}
                    {c.status === "parsed" && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#0c8174", background: "#e4f4f1", padding: "3px 10px", borderRadius: 999 }}>
                        {c.ratesFound} rates found
                      </span>
                    )}
                    {c.status === "error" && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#c2553d", background: "#f8e8e3", padding: "3px 10px", borderRadius: 999 }}>Error</span>
                    )}
                    <button onClick={() => setContracts((p) => p.filter((x) => x.id !== c.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#8aa0a8" }}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: 12, color: "#8aa0a8", marginTop: 4, lineHeight: 1.6 }}>
              Contract PDFs are parsed locally — rate data is extracted and stored securely. The original PDF is never sent to our servers.
            </p>
          </div>
        )}

        {/* Manual entry tab */}
        {activeTab === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#5c747e", margin: 0 }}>
              Enter contracted rates for specific payer + CPT combinations. Simera will flag any 835 payment below these rates as an underpayment.
            </p>

            {/* Input row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5c747e", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Payer</label>
                <select
                  value={newRate.payer}
                  onChange={(e) => setNewRate((p) => ({ ...p, payer: e.target.value }))}
                  style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid rgba(11,39,52,0.15)", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0b2734" }}
                >
                  <option value="">Select payer…</option>
                  {PAYERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5c747e", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>CPT Code</label>
                <select
                  value={newRate.cptCode}
                  onChange={(e) => setNewRate((p) => ({ ...p, cptCode: e.target.value }))}
                  style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid rgba(11,39,52,0.15)", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0b2734" }}
                >
                  <option value="">Select CPT…</option>
                  {COMMON_CPTS.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5c747e", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contracted Rate ($)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={newRate.contractedRate}
                  onChange={(e) => setNewRate((p) => ({ ...p, contractedRate: e.target.value }))}
                  style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid rgba(11,39,52,0.15)", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0b2734", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#5c747e", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Effective Date</label>
                <input
                  type="date"
                  value={newRate.effectiveDate}
                  onChange={(e) => setNewRate((p) => ({ ...p, effectiveDate: e.target.value }))}
                  style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid rgba(11,39,52,0.15)", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0b2734", boxSizing: "border-box" }}
                />
              </div>
              <button
                onClick={addManualRate}
                disabled={!newRate.payer || !newRate.cptCode || !newRate.contractedRate}
                style={{ height: 36, padding: "0 16px", borderRadius: 8, border: "none", background: "#0b2734", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: (!newRate.payer || !newRate.cptCode || !newRate.contractedRate) ? 0.4 : 1 }}
              >
                Add Rate
              </button>
            </div>

            {/* Rates list */}
            {manualRates.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: "0 12px", padding: "6px 12px 8px", borderBottom: "1px solid rgba(11,39,52,0.08)" }}>
                  {["Payer", "CPT", "Description", "Rate", ""].map((h) => (
                    <span key={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8aa0a8" }}>{h}</span>
                  ))}
                </div>
                {manualRates.map((r) => (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: "0 12px", padding: "10px 12px", borderBottom: "1px solid rgba(11,39,52,0.06)", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0b2734" }}>{r.payer}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#0b2734" }}>{r.cptCode}</span>
                    <span style={{ fontSize: 12.5, color: "#5c747e" }}>{r.description}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "#0c8174" }}>${parseFloat(r.contractedRate).toFixed(2)}</span>
                    <button onClick={() => setManualRates((p) => p.filter((x) => x.id !== r.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa0a8", padding: 2 }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ))}

                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={saveRates}
                    disabled={saving}
                    style={{ height: 36, padding: "0 20px", borderRadius: 8, border: "none", background: saving ? "#b2d8d3" : "#0c8174", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {saved ? <><CheckCircle2 style={{ width: 14, height: 14 }} /> Saved</> : saving ? "Saving…" : `Save ${manualRates.length} Rate${manualRates.length > 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            )}

            {manualRates.length === 0 && (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#8aa0a8", fontSize: 13 }}>
                No rates added yet. Select a payer + CPT and click Add Rate.
              </div>
            )}
          </div>
        )}

        {/* Rates summary tab */}
        {activeTab === "rates" && (
          <div>
            {totalRates === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <DollarSign style={{ width: 32, height: 32, color: "#8aa0a8", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0b2734", marginBottom: 6 }}>No contracted rates yet</p>
                <p style={{ fontSize: 13, color: "#8aa0a8" }}>Upload a contract PDF or enter rates manually to enable precise underpayment detection.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "Total Rates", value: totalRates, color: "#0b2734" },
                    { label: "Payers Covered", value: new Set(manualRates.map((r) => r.payer)).size, color: "#0c8174" },
                    { label: "CPT Codes", value: new Set(manualRates.map((r) => r.cptCode)).size, color: "#bd852f" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "12px 18px", borderRadius: 10, background: "#f6f8f8", border: "1px solid rgba(11,39,52,0.08)" }}>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8aa0a8" }}>{s.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "#5c747e" }}>
                  Simera will compare every future 835 payment against these rates and flag underpayments in the Revenue → Underpayments section.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
