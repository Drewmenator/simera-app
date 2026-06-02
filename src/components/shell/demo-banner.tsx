"use client";

import { FlaskConical, Upload } from "lucide-react";

interface DemoBannerProps {
  onUploadClick: () => void;
}

export function DemoBanner({ onUploadClick }: DemoBannerProps) {
  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(90deg, rgba(20,184,166,0.12) 0%, rgba(8,145,178,0.08) 100%)",
        borderBottom: "1px solid rgba(20,184,166,0.25)",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <FlaskConical size={14} color="#14b8a6" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#0b2734", lineHeight: 1.3 }}>
            Demo mode — sample practice data
          </p>
          <p className="hidden md:block" style={{ margin: 0, fontSize: 11.5, color: "#5c747e", lineHeight: 1.3 }}>
            Riverview Family Medicine · fictional practice · Upload your 835 ERA for real numbers.
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
          background: "#14b8a6",
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
