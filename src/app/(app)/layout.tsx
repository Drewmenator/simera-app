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
import { PageTransition } from "@/components/shell/page-transition";
import { useBaa } from "@/lib/use-baa";
import { AuditHistoryPanel } from "@/components/history/audit-history-panel";
import type { AuditResult } from "@/lib/api";

function AppShell({ children }: { children: React.ReactNode }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [baaOpen, setBaaOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { setResult } = useAuditContext();
  const { baaAccepted, acceptBaa } = useBaa();

  const handleAuditComplete = (result: AuditResult) => {
    setResult(result);
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
      style={{
        display: "grid",
        gridTemplateColumns: "268px 1fr",
        height: "100vh",
        overflow: "hidden",
        background: "#e9eded",
      }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0 }}>
        <Sidebar onUploadClick={handleUploadClick} />
      </div>

      {/* Mobile sidebar drawer */}
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onUploadClick={handleUploadClick}
      />

      {/* Main column */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#e9eded" }}>
        <Topbar onMenuClick={() => setMobileNavOpen(true)} onHistoryClick={() => setHistoryOpen(true)} />
        <DemoBanner />
        <main style={{ flex: 1, overflowY: "auto", padding: "26px 34px 60px" }}>
          <div style={{ maxWidth: 1340, margin: "0 auto" }}>
            <PageTransition key={typeof window !== "undefined" ? window.location.pathname : ""}>{children}</PageTransition>
          </div>
        </main>
      </div>

      <BaaModal
        open={baaOpen}
        onAccept={handleBaaAccept}
        onClose={() => setBaaOpen(false)}
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
        onSelectAudit={(selectedResult) => {
          setResult(selectedResult);
          setHistoryOpen(false);
        }}
        currentAuditId={undefined}
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
