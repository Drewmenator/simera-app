import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/legal(.*)",
  "/waitlist(.*)",
]);

// Beta allowlist — emails that can access the app.
// Add addresses here or set ALLOWED_EMAILS env var as comma-separated list.
function getAllowedEmails(): Set<string> {
  const envList = process.env.ALLOWED_EMAILS ?? "";
  const fromEnv = envList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Hardcoded seed list — always allowed
  // Seed list from env var — set SEED_ALLOWED_EMAILS in Vercel env settings
  const seedEnv = process.env.SEED_ALLOWED_EMAILS ?? "andrewesiri@gmail.com,drew@simera.health";
  const seed = seedEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set([...seed, ...fromEnv]);
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

  // Check allowlist for app routes
  const { sessionClaims } = await auth();
  const email: string =
    (sessionClaims?.email as string) ??
    (sessionClaims?.["https://clerk.com/email"] as string) ??
    "";

  const allowed = getAllowedEmails();
  // If allowlist is empty (not configured), allow all signed-in users
  if (allowed.size > 0 && email && !allowed.has(email.toLowerCase())) {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
