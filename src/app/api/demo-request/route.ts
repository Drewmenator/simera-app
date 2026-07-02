/**
 * POST /api/demo-request
 *
 * Receives book-demo form submissions and relays them to the backend's
 * /internal/notify-demo-request endpoint, which emails the team inbox.
 * Never fails the user. Lead capture must not depend on notification infra.
 *
 * Environment variables:
 *   INTERNAL_NOTIFY_TOKEN   Shared secret for the backend relay (must match
 *                           the ECS task env). Absent → dev-mode log only.
 *   NEXT_PUBLIC_API_URL     Backend base URL.
 *
 * Public route (declared in src/proxy.ts). Hardened accordingly:
 * per-IP rate limit + CR/LF stripped from every interpolated field.
 */

import { NextRequest, NextResponse } from "next/server";

interface DemoRequestBody {
  name: string;
  email: string;
  practice: string;
  specialty: string;
  providers: string;
  message?: string;
}

// Best-effort per-IP rate limit. Serverless instances are ephemeral, so this
// is per-instance, good enough to stop naive form spam, not a security
// boundary (the backend relay has its own limit + shared-secret gate).
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

/** Strip CR/LF (header-injection hygiene) and cap length. */
function clean(value: unknown, max = 200): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body: DemoRequestBody = await req.json();

    const name = clean(body.name);
    const email = clean(body.email);
    const practice = clean(body.practice);
    const specialty = clean(body.specialty);
    const providers = clean(body.providers, 50);
    const message = clean(body.message, 2000);

    if (!name || !email || !practice || !specialty || !providers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject = `[Demo Request] ${practice}. ${specialty}`;
    const text = [
      `New demo request from the Simera book-demo page.`,
      ``,
      `Name:      ${name}`,
      `Email:     ${email}`,
      `Practice:  ${practice}`,
      `Specialty: ${specialty}`,
      `Providers: ${providers}`,
      `Message:   ${message || "(none)"}`,
      ``,
      `─────────────────────────────────────────`,
      `Received: ${new Date().toISOString()}`,
    ].join("\n");

    const notifyToken = process.env.INTERNAL_NOTIFY_TOKEN;
    if (notifyToken) {
      const backendBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      await fetch(`${backendBase}/internal/notify-demo-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": notifyToken,
        },
        body: JSON.stringify({ subject, text }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => null); // never fail the user on notification errors
    } else {
      // Dev-mode log (no PII beyond practice metadata)
      console.log(
        `[demo-request] New request from practice=${practice} specialty=${specialty} providers=${providers}`,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo-request] handler error:", err);
    // Always return 200, never fail the user on a lead-capture endpoint
    return NextResponse.json({ ok: true });
  }
}
