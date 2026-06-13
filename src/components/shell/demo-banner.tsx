"use client";

import { FlaskConical, Upload, Cpu } from "lucide-react";
import { useSparkAgent } from "@/lib/use-spark";

interface DemoBannerProps {
  onUploadClick: () => void;
}

export function DemoBanner({ onUploadClick }: DemoBannerProps) {
  const spark = useSparkAgent();

  if (spark.detected) {
    // Spark Agent mode — PHI never leaves this machine
    return (
      <div
        style={{
          width: "100%",
          background: "linear-gradient(90deg, rgba(12,129,116,0.14) 0%, rgba(12,129,116,0.06) 100%)",
          borderBottom: "1px solid rgba(12,129,116,0.30)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Cpu size={14} color="#0c8174" style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#0b2734", lineHeight: 1.3 }}>
              Spark Agent — on-premise mode
            </p>
            <p className="hidden md:block" style={{ margin: 0, fontSize: 11.5, color: "#5c747e", lineHeight: 1.3 }}>
              PHI never leaves this machine · AI running locally · Zero cloud exposure
            </p>
          </div>
        </div>
        <button
          onClick={onUploadClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            background: "#0c8174",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          <Upload size={12} />
          Upload 835
        </button>
      </div>
    );
  }

  // Cloud / demo mode
  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(90deg, #e8f7f5 0%, #eaf6f9 100%)",
        borderBottom: "1.5px solid rgba(20,184,166,0.35)",
        padding: "7px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: "rgba(20,184,166,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FlaskConical size={13} color="#0c8174" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#0b2734", lineHeight: 1.3 }}>
              Sample Audit — Riverview Family Medicine
            </p>
            <span style={{
              display: "inline-block", padding: "1px 7px", borderRadius: 20,
              background: "rgba(20,184,166,0.18)", color: "#0c8174",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", lineHeight: 1.6,
            }}>
              SYNTHETIC DATA · NO PHI
            </span>
          </div>
          <p className="hidden md:block" style={{ margin: 0, fontSize: 11, color: "#5c747e", lineHeight: 1.3 }}>
            These are fictional numbers. Upload your own 835 ERA to see your actual revenue recovery opportunity.
          </p>
        </div>
      </div>
      <button
        onClick={onUploadClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 14px",
          background: "#0b2734",
          color: "#ffffff",
          border: "none",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}
      >
        <Upload size={12} />
        See YOUR numbers →
      </button>
    </div>
  );
}
