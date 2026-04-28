import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/monitoring",
          "/pathlight/",
          "/templates/",
          "/admin/",
          "/portal/",
          "/internal/",
          "/signin",
          "/invite/",
        ],
      },
    ],
    sitemap: "https://dbjtechnologies.com/sitemap.xml",
  };
}
