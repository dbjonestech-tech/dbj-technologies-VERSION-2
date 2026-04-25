import type { MetadataRoute } from "next";
import { getServiceSlugs } from "@/lib/service-data";
import { getPricingSlugs } from "@/lib/pricing-data";
import { getProjectSlugs } from "@/lib/work-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dbjtechnologies.com";

  /* ─── Static routes ─────────────────────────────── */
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/work",
    "/process",
    "/pricing",
    "/pathlight",
    "/faq",
    "/contact",
    "/why-dbj",
    "/privacy",
    "/terms",
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority:
      route === ""
        ? 1
        : route === "/services" || route === "/pricing" || route === "/pathlight"
          ? 0.9
          : 0.8,
  }));

  /* ─── Service detail pages ──────────────────────── */
  const serviceEntries = getServiceSlugs().map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  /* ─── Pricing detail pages ──────────────────────── */
  const pricingEntries = getPricingSlugs().map((slug) => ({
    url: `${baseUrl}/pricing/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  /* ─── Project/work detail pages ─────────────────── */
  const projectEntries = getProjectSlugs().map((slug) => ({
    url: `${baseUrl}/work/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...serviceEntries, ...pricingEntries, ...projectEntries];
}
