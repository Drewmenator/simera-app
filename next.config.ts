import type { NextConfig } from "next";

// Backend URL — where 835 files and all PHI-bearing API calls go.
// In production this is your FastAPI server, NOT Vercel.
// Vercel serves only HTML/JS/CSS — zero PHI touches Vercel infrastructure.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Extract origin from API_URL for CSP
function apiOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

const API_ORIGIN = apiOrigin(API_URL);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ── HIPAA / Security headers ──────────────────────────────────────
          //
          // Content-Security-Policy:
          //   connect-src locks down where the browser can send data.
          //   Only the Simera backend and Clerk auth are allowed.
          //   This prevents PHI from ever reaching Vercel servers or third parties.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Clerk
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.simerahealth.org https://*.clerk.accounts.dev",
              // Styles: self + inline (Tailwind)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images
              "img-src 'self' data: blob: https://img.clerk.com",
              // API calls — ONLY backend + Clerk. PHI cannot go to Vercel or anywhere else.
              `connect-src 'self' ${API_ORIGIN} https://clerk.simerahealth.org https://*.clerk.accounts.dev https://api.clerk.dev wss://*.clerk.accounts.dev`,
              // Frames: Clerk hosted pages only
              "frame-src 'self' https://clerk.simerahealth.org https://*.clerk.accounts.dev",
              // Workers
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // No content-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer: don't leak URL to third parties
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // HSTS: force HTTPS for 1 year
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Permissions: disable sensors/camera/mic (not needed, reduces attack surface)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
