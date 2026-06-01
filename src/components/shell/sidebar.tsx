"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  TrendingUp,
  Shield,
  BarChart2,
  Sparkles,
  Calculator,
  Upload,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuditData } from "@/lib/use-audit-data";
import { useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/risks", label: "Risks", icon: Shield, badge: 2 },
  { href: "/benchmarks", label: "Benchmarks", icon: BarChart2 },
  { href: "/ask", label: "Ask Simera", icon: Sparkles },
  { href: "/roi", label: "ROI Calculator", icon: Calculator },
];

interface SidebarProps {
  onUploadClick?: () => void;
}

export function Sidebar({ onUploadClick }: SidebarProps) {
  const pathname = usePathname();
  const { practiceName, metrics } = useAuditData();
  const { user } = useUser();

  const firstName = user?.firstName ?? "Drew";
  const initials = user?.firstName?.[0] ?? "D";

  const atRiskK = Math.round(metrics.totalLeakage / 1000);
  const recovK = Math.round(metrics.expectedRecovery / 1000);

  return (
    <aside
      style={{
        width: 268,
        minWidth: 268,
        background: "#0b2734",
        color: "#eaf2f3",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px 14px",
        borderRight: "1px solid rgba(0,0,0,0.25)",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 16px" }}>
        {/* Simera mark: teal square with ink notch */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#14b8a6",
            position: "relative",
            flexShrink: 0,
            boxShadow: "0 4px 12px -2px rgba(20,184,166,0.5)",
          }}
        >
          <div
            style={{
              content: '""',
              position: "absolute",
              inset: "11px 11px auto auto",
              width: 13,
              height: 13,
              borderRadius: 4,
              background: "#0b2734",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "#eaf2f3" }}>
            simera
          </div>
          <div
            style={{
              display: "block",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: "#14b8a6",
              marginTop: 4,
              textTransform: "uppercase",
            }}
          >
            health
          </div>
        </div>
      </div>

      {/* Practice selector */}
      <div
        style={{
          margin: "6px 4px 18px",
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            letterSpacing: "0.16em",
            color: "#5d7c86",
            textTransform: "uppercase",
          }}
        >
          Practice
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#eaf2f3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {practiceName}
          </span>
          <ChevronDown style={{ width: 14, height: 14, color: "#8fabb5", flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                textAlign: "left",
                fontSize: 14.5,
                fontWeight: active ? 600 : 500,
                color: active ? "#fff" : "#8fabb5",
                background: active ? "rgba(20,184,166,0.14)" : "transparent",
                textDecoration: "none",
                position: "relative",
                transition: "background 0.14s, color 0.14s",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 9,
                    bottom: 9,
                    width: 3,
                    borderRadius: "0 3px 3px 0",
                    background: "#14b8a6",
                  }}
                />
              )}
              <item.icon style={{ width: 18, height: 18, flexShrink: 0, strokeWidth: 1.9 }} />
              <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    marginLeft: "auto",
                    minWidth: 19,
                    height: 19,
                    padding: "0 6px",
                    borderRadius: 999,
                    background: "#c2553d",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: 14 }} />

      {/* At-risk card */}
      <div
        style={{
          margin: "0 4px 12px",
          padding: 16,
          borderRadius: 14,
          background: "linear-gradient(160deg, rgba(194,85,61,0.16), rgba(194,85,61,0.05))",
          border: "1px solid rgba(194,85,61,0.28)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            letterSpacing: "0.16em",
            color: "#e7a999",
            textTransform: "uppercase",
          }}
        >
          <span
            className="pulse-dot"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#e08a73",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          At Risk
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginTop: 8,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${atRiskK}<span style={{ fontSize: 18, color: "#e7a999" }}>K</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#8fabb5", marginTop: 3 }}>
          ${recovK}K recoverable this quarter
        </div>
      </div>

      {/* Footer nav */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          paddingTop: 6,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <button
          onClick={onUploadClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "9px 12px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            color: "#8fabb5",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Upload style={{ width: 18, height: 18, strokeWidth: 1.9 }} />
          Upload 835 file
        </button>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "9px 12px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            color: pathname === "/settings" ? "#fff" : "#8fabb5",
            background: pathname === "/settings" ? "rgba(20,184,166,0.14)" : "transparent",
            textDecoration: "none",
          }}
        >
          <Settings style={{ width: 18, height: 18, strokeWidth: 1.9 }} />
          Settings
        </Link>
      </div>

      {/* User row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px 4px", marginTop: 4 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "linear-gradient(135deg, #2a6f97, #0c8174)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#eaf2f3" }}>{firstName}</span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9.5,
            letterSpacing: "0.1em",
            color: "#14b8a6",
            border: "1px solid rgba(20,184,166,0.4)",
            padding: "2px 7px",
            borderRadius: 5,
            textTransform: "uppercase",
          }}
        >
          PRO
        </span>
      </div>

      {/* Legal links */}
      <div style={{ display: "flex", gap: 12, padding: "8px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 4 }}>
        <Link href="/legal/terms" style={{ fontSize: 11, color: "rgba(234,242,243,0.35)", textDecoration: "none" }}>Terms</Link>
        <Link href="/legal/privacy" style={{ fontSize: 11, color: "rgba(234,242,243,0.35)", textDecoration: "none" }}>Privacy</Link>
      </div>
    </aside>
  );
}
