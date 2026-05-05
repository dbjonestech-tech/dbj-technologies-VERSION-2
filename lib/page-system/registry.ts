import type { PageConfig } from "./types";

export const pageRegistry: Record<string, PageConfig> = {
  "/resources/core-web-vitals-explained": {
    slug: "/resources/core-web-vitals-explained",
    title: "Core Web Vitals Explained for Service Businesses",
    description:
      "What LCP, INP, and CLS actually measure, what scores Google rewards, and how to fix a slow site without burning a quarter on it.",
    archetype: "editorial",
    accent: "cyan",
    hero: "data-driven",
    sectionBreak: "stat",
    texture: "grain",
    density: "standard",
    imageTreatment: "duotone",
    cluster: "resources-educational",
    pillar: "/resources/website-performance-audit",
    lastReviewed: "2026-05-04",
    nextReviewDue: "2026-11-04",
    sourcesCount: 11,
  },
  "/resources/agency-vs-studio-vs-freelancer": {
    slug: "/resources/agency-vs-studio-vs-freelancer",
    title: "Agency, Studio, or Freelancer: How to Pick One",
    description:
      "Three buyer profiles, three cost structures, three failure modes. An honest framing of which model fits your business, with industry data and a recommendation I would give my own family.",
    archetype: "reference",
    accent: "violet",
    hero: "typographic",
    sectionBreak: "gradient-rule",
    texture: "clean",
    density: "standard",
    imageTreatment: "none",
    cluster: "resources-decision",
    pillar: "/resources/agency-vs-studio-vs-freelancer",
    lastReviewed: "2026-05-04",
    nextReviewDue: "2026-11-04",
    sourcesCount: 6,
  },
};
