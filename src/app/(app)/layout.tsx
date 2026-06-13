"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileSidebar } from "@/components/shell/mobile-sidebar";
import { UploadModal } from "@/components/upload/upload-modal";
import { DemoBanner } from "@/components/shell/demo-banner";
import { WelcomeOverlay } from "@/components/onboarding/welcome-overlay";
import { BaaModal } from "@/components/onboarding/baa-modal";
import { AuditProvider, useAuditContext } from "@/lib/audit-context";
import { useAuditData } from "@/lib/use-audit-data";
import { PageTransition } from "@/components/shell/page-transition";
import { useBaa } from "@/lib/use-baa";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { AuditHistoryPanel } from "@/components/history/audit-history-panel";
import type { AuditResult } from "@/lib/api";

function AppShell({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [baaOpen, setBaaOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historicalAuditId, setHistoricalAuditId] = useState<string | undefined>(undefined);
  const [historicalAuditPeriod, setHistoricalAuditPeriod] = useState<string | undefined>(undefined);
  const { setResult } = useAuditContext();
  const { baaAccepted, acceptBaa } = useBaa();
  const auditData = useAuditData();
  useIdleTimeout();

  const handleAuditComplete = (result: AuditResult) => {
    setResult(result);
    // A fresh upload clears any "viewing historical" state
    setHistoricalAuditId(undefined);
    setHistoricalAuditPeriod(undefined);
  };

  const handleUploadClick = () => {
    if (!baaAccepted) {
      setBaaOpen(true);
    } else {
      setUploadOpen(true);
    }
  };

  const handleBaaAccept = () => {
    acceptBaa();
    setBaaOpen(false);
    setUploadOpen(true);
  };

  return (
    <div
      className="flex flex-col md:grid md:grid-cols-[268px_1fr]"
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#e9eded",
      }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ overflow: "hidden" }}>
        <Sidebar onUploadClick={handleUploadClick} />
      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onUploadClick={handleUploadClick}
      />

      {/* Main column */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#e9eded", minWidth: 0 }}>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onHistoryClick={() => setHistoryOpen(true)} />
        {!auditData.isLive && <DemoBanner onUploadClick={handleUploadClick} />}
        {/* Historical-audit notice */}
        {historicalAuditId && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 20px", background: "#0b2734", color: "#fff", fontSize: 12.5,
            gap: 12, flexShrink: 0,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🕒</span>
              <span>
                Viewing historical audit
                {historicalAuditPeriod && <span style={{ color: "#14b8a6", fontWeight: 600 }}> · {historicalAuditPeriod}</span>}
              </span>
            </span>
            <button
              onClick={() => {
                setHistoricalAuditId(undefined);
                setHistoricalAuditPeriod(undefined);
                handleUploadClick();
              }}
              style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.08)",
                color: "#fff", cursor: "pointer",
              }}
            >
              Upload new file
            </button>
          </div>
        )}
        <main style={{ flex: 1, overflowY: "auto" }} className="px-4 py-5 pb-16 md:px-[34px] md:py-[26px] md:pb-[60px]">
          <div style={{ maxWidth: 1340, margin: "0 auto" }}>
            <PageTransition key={typeof window !== "undefined" ? window.location.pathname : ""}>{children}</PageTransition>
          </div>
        </main>
      </div>

      <BaaModal
        open={baaOpen}
        onAccept={handleBaaAccept}
        onClose={() => setBaaOpen(false)}
        organization={auditData.practiceName}
      />
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleAuditComplete}
      />
      <WelcomeOverlay onUploadClick={handleUploadClick} />
      <AuditHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectAudit={(selectedResult, auditId, period) => {
          setResult(selectedResult);
          setHistoricalAuditId(auditId);
          setHistoricalAuditPeriod(period);
          setHistoryOpen(false);
        }}
        currentAuditId={historicalAuditId}
      />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuditProvider>
      <AppShell>{children}</AppShell>
    </AuditProvider>
  );
}
