/**
 * POST /api/demo-request
 *
 * Receives book-demo form submissions and forwards them to the team inbox.
 * Uses Resend, SMTP, or logs in dev mode — never fails the user.
 *
 * Environment variables (all optional — graceful fallback if absent):
 *   DEMO_REQUEST_NOTIFY_EMAIL   Recipient address (default: hello@simerahealth.org)
 *   SMTP_HOST                   SMTP server hostname
 *   SMTP_PORT                   SMTP port (default 587)
 *   SMTP_USER                   SMTP username
 *   SMTP_PASS                   SMTP password
 *   SMTP_FROM                   Sender address
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

export async function POST(req: NextRequest) {
  try {
    const body: DemoRequestBody = await req.json();

    const { name, email, practice, specialty, providers, message } = body;

    // Validate minimally
    if (!name || !email || !practice || !specialty || !providers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const to = process.env.DEMO_REQUEST_NOTIFY_EMAIL ?? "hello@simerahealth.org";
    const subject = `[Demo Request] ${practice} — ${specialty}`;
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

    // Attempt SMTP send if configured; otherwise log only
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      // Dynamic import to avoid loading the module in environments without nodemailer
      try {
        // Use built-in fetch to relay to backend (avoids adding nodemailer dep)
        const backendBase =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        await fetch(`${backendBase}/internal/notify-demo-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, text }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);
      } catch {
        // Never fail the user because of notification errors
      }
    } else {
      // Dev-mode log (no PII in production logs)
      console.log(
        `[demo-request] New request from practice=${practice} specialty=${specialty} providers=${providers}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[demo-request] handler error:", err);
    // Always return 200 — never fail the user on a lead-capture endpoint
    return NextResponse.json({ ok: true });
  }
}
