import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/waitlist", "/trust", "/book-demo", "/legal/"],
        disallow: [
          "/sign-in",
          "/sign-up",
          "/onboarding",
          "/api/",
          "/(app)/",
          // Authenticated app routes — no indexing
          "/revenue",
          "/appeals",
          "/benchmarks",
          "/compliance",
          "/risks",
          "/roi",
          "/contracts",
          "/settings",
          "/ask",
          "/admin/",
        ],
      },
    ],
    sitemap: "https://app.simerahealth.org/sitemap.xml",
  };
}
