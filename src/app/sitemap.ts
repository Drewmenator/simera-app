import type { MetadataRoute } from "next";

const BASE = "https://app.simerahealth.org";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/waitlist`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/book-demo`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/trust`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/legal/terms`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/legal/privacy`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/legal/baa`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/legal/hipaa`,
      lastModified: new Date("2026-06-11"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
