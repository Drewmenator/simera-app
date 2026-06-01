"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Download, Loader2, Mail, Menu, X, ArrowRight, AlertTriangle, Info, CheckCircle2, LogOut, User, History } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { EmailReportModal } from "@/components/email/email-report-modal";
import { useAuditData } from "@/lib/use-audit-data";
import { motion, AnimatePresence } from "framer-motion";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Revenue overview", subtitle: "Jan – May 2026 · Riverview Family Medicine" },
  "/revenue": { title: "Revenue", subtitle: "Leakage analysis · Denial patterns · Payer scorecard" },
  "/risks": { title: "Risks", subtitle: "Active alerts requiring your attention" },
  "/benchmarks": { title: "Benchmarks", subtitle: "How you compare to 1,400+ similar practices" },
  "/ask": { title: "Ask Simera", subtitle: "AI-powered revenue intelligence, on demand" },
  "/settings": { title: "Settings", subtitle: "Practice, team, billing, and security" },
  "/roi": { title: "ROI Calculator", subtitle: "See exactly what Simera pays back — in dollars and days" },
};

const SEARCH_ITEMS = [
  { label: "Revenue overview", href: "/", category: "Pages" },
  { label: "Revenue leakage analysis", href: "/revenue", category: "Pages" },
  { label: "Active risks & alerts", href: "/risks", category: "Pages" },
  { label: "Payer benchmarks", href: "/benchmarks", category: "Pages" },
  { label: "Ask Simera AI", href: "/ask", category: "Pages" },
  { label: "ROI Calculator", href: "/roi", category: "Pages" },
  { label: "Settings", href: "/settings", category: "Pages" },
  { label: "Upload 835 file", href: "/", category: "Actions" },
  { label: "What's my denial rate?", href: "/ask", category: "Ask Simera" },
  { label: "Which payer is worst?", href: "/ask", category: "Ask Simera" },
  { label: "Fastest $10K to recover", href: "/ask", category: "Ask Simera" },
];

const NOTIFICATIONS = [
  { id: 1, type: "critical", title: "CO-197 Prior Auth Denials", body: "23 United Healthcare claims unworked — $18,240 at risk", time: "2h ago", read: false },
  { id: 2, type: "warning", title: "Timely Filing Deadline", body: "Aetna 90-day window closes in 8 days for 6 claims", time: "5h ago", read: false },
  { id: 3, type: "info", title: "New benchmark data available", body: "Q1 2026 denial rate benchmarks updated for family medicine", time: "1d ago", read: true },
  { id: 4, type: "success", title: "Recovery opportunity found", body: "Undercoding pattern detected — potential $12K annual uplift", time: "2d ago", read: true },
];

interface TopbarProps {
  onMenuClick?: () => void;
  onHistoryClick?: () => void;
}

export function Topbar({ onMenuClick, onHistoryClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const auditData = useAuditData();
  const page = pageTitles[pathname] ?? pageTitles["/"];

  const [downloading, setDownloading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const searchRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setBellOpen(false);
        setUserMenuOpen(false);
        setExportMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const filtered = searchQuery.trim()
    ? SEARCH_ITEMS.filter((i) => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_ITEMS.slice(0, 7);

  const handleSearchSelect = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleDownloadPDF = async () => {
    setExportMenuOpen(false);
    setDownloading(true);
    try {
      const { downloadAuditPDF } = await import("@/components/pdf/audit-pdf");
      await downloadAuditPDF();
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  const notifIcon = (type: string) => {
    if (type === "critical") return <AlertTriangle style={{ width: 14, height: 14, color: "#c2553d", flexShrink: 0, marginTop: 2 }} />;
    if (type === "warning") return <AlertTriangle style={{ width: 14, height: 14, color: "#bd852f", flexShrink: 0, marginTop: 2 }} />;
    if (type === "success") return <CheckCircle2 style={{ width: 14, height: 14, color: "#0c8174", flexShrink: 0, marginTop: 2 }} />;
    return <Info style={{ width: 14, height: 14, color: "#2a6f97", flexShrink: 0, marginTop: 2 }} />;
  };

  return (
    <>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "18px 34px 16px",
          background: "rgba(233,237,237,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(11,39,52,0.10)",
          flexShrink: 0,
          zIndex: 5,
        }}
      >
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden"
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            border: "1px solid rgba(11,39,52,0.10)",
            background: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Menu style={{ width: 16, height: 16, color: "#5c747e" }} />
        </button>

        {/* Page title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 23,
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#0b2734",
              margin: 0,
            }}
          >
            {page.title}
          </h1>
          <p style={{ fontSize: 13.5, color: "#5c747e", marginTop: 2 }}>{page.subtitle}</p>
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 15px",
              borderRadius: 10,
              border: "1px solid rgba(11,39,52,0.10)",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 500,
              color: "#5c747e",
              cursor: "pointer",
              minWidth: 200,
              justifyContent: "flex-start",
              boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
            }}
          >
            <Search style={{ width: 16, height: 16 }} />
            <span style={{ flex: 1 }}>Search</span>
            <kbd
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                background: "#f6f8f8",
                border: "1px solid rgba(11,39,52,0.10)",
                borderRadius: 5,
                padding: "2px 6px",
                color: "#8aa0a8",
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* History button */}
          <button
            onClick={onHistoryClick}
            title="Audit history"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 15px",
              borderRadius: 10,
              border: "1px solid rgba(11,39,52,0.10)",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#0b2734",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
            }}
          >
            <History style={{ width: 16, height: 16 }} />
            History
          </button>

          {/* Export button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              disabled={downloading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 15px",
                borderRadius: 10,
                border: "1px solid rgba(11,39,52,0.10)",
                background: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0b2734",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
              }}
            >
              {downloading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : <Download style={{ width: 16, height: 16 }} />}
              Export
            </button>
            <AnimatePresence>
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 6,
                      zIndex: 20,
                      background: "#fff",
                      border: "1px solid rgba(11,39,52,0.10)",
                      borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 10px 26px -14px rgba(11,39,52,0.22)",
                      padding: "4px 0",
                      width: 190,
                    }}
                  >
                    <button
                      onClick={handleDownloadPDF}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, color: "#0b2734", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <Download style={{ width: 14, height: 14, color: "#8aa0a8" }} />
                      Download PDF
                    </button>
                    <button
                      onClick={() => { setExportMenuOpen(false); setEmailOpen(true); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, color: "#0b2734", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <Mail style={{ width: 14, height: 14, color: "#8aa0a8" }} />
                      Email report
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setBellOpen((v) => !v); setUserMenuOpen(false); }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: "1px solid rgba(11,39,52,0.10)",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 1px 2px rgba(11,39,52,0.05)",
              }}
            >
              <Bell style={{ width: 18, height: 18, color: "#5c747e" }} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 9,
                    right: 10,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#c2553d",
                    border: "1.5px solid #fff",
                  }}
                />
              )}
            </button>
            <AnimatePresence>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 6,
                      zIndex: 20,
                      background: "#fff",
                      border: "1px solid rgba(11,39,52,0.10)",
                      borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)",
                      width: 320,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(11,39,52,0.10)" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0b2734" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: 12, color: "#0c8174", background: "none", border: "none", cursor: "pointer" }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            display: "flex",
                            gap: 12,
                            padding: "12px 16px",
                            borderBottom: "1px solid rgba(11,39,52,0.06)",
                            background: !n.read ? "rgba(20,184,166,0.04)" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          {notifIcon(n.type)}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: "#0b2734" }}>{n.title}</p>
                            <p style={{ fontSize: 12, color: "#5c747e", marginTop: 2 }}>{n.body}</p>
                            <p style={{ fontSize: 11, color: "#8aa0a8", marginTop: 4 }}>{n.time}</p>
                          </div>
                          {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", flexShrink: 0, marginTop: 6 }} />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setUserMenuOpen((v) => !v); setBellOpen(false); }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2a6f97, #0c8174)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
              }}
            >
              {initials}
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 6,
                      zIndex: 20,
                      background: "#fff",
                      border: "1px solid rgba(11,39,52,0.10)",
                      borderRadius: 12,
                      boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)",
                      width: 210,
                      padding: "4px 0",
                    }}
                  >
                    <div style={{ padding: "10px 16px 12px", borderBottom: "1px solid rgba(11,39,52,0.10)" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0b2734" }}>{user?.fullName ?? "Your Account"}</p>
                      <p style={{ fontSize: 12, color: "#5c747e", marginTop: 2 }}>{user?.emailAddresses?.[0]?.emailAddress ?? ""}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, color: "#0b2734", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <User style={{ width: 14, height: 14, color: "#8aa0a8" }} />
                      Account settings
                    </button>
                    <div style={{ borderTop: "1px solid rgba(11,39,52,0.10)", paddingTop: 4 }}>
                      <button
                        onClick={() => signOut({ redirectUrl: "/sign-in" })}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, color: "#c2553d", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      >
                        <LogOut style={{ width: 14, height: 14 }} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", padding: "15vh 16px 0" }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(11,39,52,0.4)", backdropFilter: "blur(4px)" }} onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 520,
                background: "#fff",
                border: "1px solid rgba(11,39,52,0.10)",
                borderRadius: 16,
                boxShadow: "0 1px 2px rgba(11,39,52,0.05), 0 24px 48px -20px rgba(11,39,52,0.30)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(11,39,52,0.10)" }}>
                <Search style={{ width: 16, height: 16, color: "#8aa0a8", flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, actions, ask Simera…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#0b2734" }}
                />
                <button onClick={() => setSearchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8aa0a8" }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <div style={{ padding: "6px 0", maxHeight: 320, overflowY: "auto" }}>
                {filtered.length === 0 ? (
                  <p style={{ fontSize: 14, color: "#8aa0a8", padding: "24px 16px", textAlign: "center" }}>No results for "{searchQuery}"</p>
                ) : (
                  Object.entries(
                    filtered.reduce((acc, item) => {
                      (acc[item.category] ??= []).push(item);
                      return acc;
                    }, {} as Record<string, typeof SEARCH_ITEMS>)
                  ).map(([category, items]) => (
                    <div key={category}>
                      <p style={{ fontSize: 10, color: "#8aa0a8", textTransform: "uppercase", letterSpacing: "0.12em", padding: "6px 16px", fontFamily: "'IBM Plex Mono', monospace" }}>
                        {category}
                      </p>
                      {items.map((item) => (
                        <button
                          key={item.href + item.label}
                          onClick={() => handleSearchSelect(item.href)}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", fontSize: 14, color: "#0b2734", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span>{item.label}</span>
                          <ArrowRight style={{ width: 14, height: 14, color: "#8aa0a8" }} />
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
              <div style={{ borderTop: "1px solid rgba(11,39,52,0.10)", padding: "8px 16px", display: "flex", gap: 16, fontSize: 11, color: "#8aa0a8", fontFamily: "'IBM Plex Mono', monospace" }}>
                <span><kbd>↑↓</kbd> navigate</span>
                <span><kbd>↵</kbd> select</span>
                <span><kbd>esc</kbd> close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EmailReportModal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        auditData={{
          practiceName: auditData.practiceName,
          dataRange: auditData.dataRange,
          totalLeakage: auditData.metrics.totalLeakage,
          expectedRecovery: auditData.metrics.expectedRecovery,
        }}
      />
    </>
  );
}
