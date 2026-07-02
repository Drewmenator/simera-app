import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/legal(.*)",
  "/waitlist(.*)",
  "/trust(.*)",
  "/book-demo(.*)",
  // Lead-capture API for the public book-demo form. Without this entry the
  // middleware redirected anonymous POSTs to sign-in — every inbound demo
  // request silently failed. Exact path only; rate-limited in the handler.
  "/api/demo-request",
]);

// Beta allowlist — emails that can access the app. Env-only (no hardcoded
// fallback): set SEED_ALLOWED_EMAILS and/or ALLOWED_EMAILS in Vercel as
// comma-separated lists. An empty allowlist denies everyone (fail closed).
function getAllowedEmails(): Set<string> {
  const parse = (v: string | undefined) =>
    (v ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set([
    ...parse(process.env.SEED_ALLOWED_EMAILS),
    ...parse(process.env.ALLOWED_EMAILS),
  ]);
}

// userId → primary email, resolved via Clerk's backend API when the session
// token carries no email claim. Default Clerk session tokens don't include
// one, so relying on the claim alone let every fresh sign-up straight through.
// Module-scope cache is best-effort per isolate; avoids an API call per request.
const emailCache = new Map<string, { email: string; at: number }>();
const EMAIL_CACHE_TTL_MS = 5 * 60 * 1000;

async function resolveEmail(userId: string): Promise<string> {
  const cached = emailCache.get(userId);
  if (cached && Date.now() - cached.at < EMAIL_CACHE_TTL_MS) return cached.email;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = (
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      ""
    ).toLowerCase();
    emailCache.set(userId, { email, at: Date.now() });
    return email;
  } catch {
    // Unresolvable identity = not allowlisted (fail closed).
    return "";
  }
}

const CANONICAL_HOST = "app.simerahealth.org";

export default clerkMiddleware(async (auth, request) => {
  // Canonical-host redirect: Clerk's production keys are authorized ONLY for
  // app.simerahealth.org, so any *.vercel.app alias can't load the auth UI.
  // In production, forward all non-canonical hosts to the custom domain.
  // (Guarded to VERCEL_ENV=production so preview deployments keep their URLs.)
  if (process.env.VERCEL_ENV === "production") {
    const host = request.headers.get("host") ?? "";
    if (host !== CANONICAL_HOST && host.endsWith(".vercel.app")) {
      const url = new URL(request.url);
      url.protocol = "https:";
      url.host = CANONICAL_HOST;
      url.port = "";
      return NextResponse.redirect(url, 308);
    }
  }

  if (isPublicRoute(request)) return;

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  // Check allowlist for app routes. Prefer the session claim (free); fall
  // back to Clerk's backend API when the token has no email claim. Deny on
  // anything unresolvable — the previous claim-only check silently admitted
  // every session without an email claim.
  const { sessionClaims } = await auth();
  const claimEmail: string = (
    (sessionClaims?.email as string) ??
    (sessionClaims?.["https://clerk.com/email"] as string) ??
    ""
  ).toLowerCase();

  const allowed = getAllowedEmails();
  if (claimEmail && allowed.has(claimEmail)) return;

  const resolvedEmail = claimEmail || (await resolveEmail(userId));
  if (!resolvedEmail || !allowed.has(resolvedEmail)) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
